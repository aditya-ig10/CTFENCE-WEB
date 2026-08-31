"""
Payment Encryption & ABIT-M3 Architecture (Phase 1)
Python reference implementation of the cryptographic pipeline.

Primitives:
  - AES-128-CBC (via OpenSSL ctypes or standard library)
  - HMAC-SHA256
  - Hash-based secondary DB protection (PBKDF2/scrypt/bcrypt equivalent)
  - Constant-time equality (hmac.compare_digest)
  - Discrete TOTP-style time window (T = floor((t + tz_offset) / interval))
  - ABIT Adaptive Interval (1–12hr base, risk score r in 0..7, 5-min floor)
"""

import os
import sys
import time
import math
import hmac
import hashlib
import secrets
import ctypes
import ctypes.util
from typing import Dict, List, Tuple, Optional, Any


# ---------------------------------------------------------------------------
# OpenSSL / Native AES-128-CBC Provider
# ---------------------------------------------------------------------------

class AES128CBC:
    _lib = None

    @classmethod
    def _get_lib(cls):
        if cls._lib is None:
            lib_path = ctypes.util.find_library('crypto') or 'libcrypto.dylib'
            cls._lib = ctypes.CDLL(lib_path)
        return cls._lib

    @classmethod
    def encrypt(cls, key: bytes, iv: bytes, plaintext: bytes) -> bytes:
        assert len(key) == 16, "Key must be 16 bytes for AES-128"
        assert len(iv) == 16, "IV must be 16 bytes"
        lib = cls._get_lib()
        cipher = lib.EVP_aes_128_cbc()
        ctx = lib.EVP_CIPHER_CTX_new()
        try:
            out = ctypes.create_string_buffer(len(plaintext) + 16)
            out_len = ctypes.c_int()
            final_len = ctypes.c_int()

            lib.EVP_EncryptInit_ex(ctx, cipher, None, key, iv)
            lib.EVP_EncryptUpdate(ctx, out, ctypes.byref(out_len), plaintext, len(plaintext))
            total = out_len.value
            lib.EVP_EncryptFinal_ex(ctx, ctypes.byref(out, total), ctypes.byref(final_len))
            total += final_len.value
            return out.raw[:total]
        finally:
            lib.EVP_CIPHER_CTX_free(ctx)

    @classmethod
    def decrypt(cls, key: bytes, iv: bytes, ciphertext: bytes) -> bytes:
        assert len(key) == 16, "Key must be 16 bytes for AES-128"
        assert len(iv) == 16, "IV must be 16 bytes"
        lib = cls._get_lib()
        cipher = lib.EVP_aes_128_cbc()
        ctx = lib.EVP_CIPHER_CTX_new()
        try:
            out = ctypes.create_string_buffer(len(ciphertext) + 16)
            out_len = ctypes.c_int()
            final_len = ctypes.c_int()

            lib.EVP_DecryptInit_ex(ctx, cipher, None, key, iv)
            lib.EVP_DecryptUpdate(ctx, out, ctypes.byref(out_len), ciphertext, len(ciphertext))
            total = out_len.value
            lib.EVP_DecryptFinal_ex(ctx, ctypes.byref(out, total), ctypes.byref(final_len))
            total += final_len.value
            return out.raw[:total]
        finally:
            lib.EVP_CIPHER_CTX_free(ctx)


# ---------------------------------------------------------------------------
# Key Management & Key Rotation
# ---------------------------------------------------------------------------

class KeySet:
    def __init__(self, version: str, k1: bytes, k2: bytes, k3: bytes):
        self.version = version
        self.k1 = k1  # 16 bytes (AES-128)
        self.k2 = k2  # 32 bytes (HMAC-SHA256)
        self.k3 = k3  # 16 bytes (AES-128 PII)


class KeyRegistry:
    def __init__(self, master_secret: str = "cf_default_master_sec_2026_x!"):
        self.master_secret = master_secret
        self.registry: Dict[str, KeySet] = {}
        self.active_version = "v1"
        # Seed v1
        self.register_version(self._derive_version(master_secret, "v1"))

    def _derive_version(self, seed: str, version: str) -> KeySet:
        master = hashlib.sha256(f"{seed}:{version}".encode("utf-8")).digest()
        k1 = hashlib.sha256(master + b"K1_AES128").digest()[:16]
        k2 = hashlib.sha256(master + b"K2_HMAC256").digest()
        k3 = hashlib.sha256(master + b"K3_PII_AES128").digest()[:16]
        return KeySet(version, k1, k2, k3)

    def register_version(self, key_set: KeySet, make_active: bool = False):
        self.registry[key_set.version] = key_set
        if make_active:
            self.active_version = key_set.version

    def get_key_set(self, version: Optional[str] = None) -> KeySet:
        v = version or self.active_version
        if v not in self.registry:
            # Dynamically derive historical version if not yet registered
            self.registry[v] = self._derive_version(self.master_secret, v)
        return self.registry[v]


# Global key registry
DEFAULT_KEY_REGISTRY = KeyRegistry()


# ---------------------------------------------------------------------------
# Audit Logger & Blacklist
# ---------------------------------------------------------------------------

TOKEN_BLACKLIST = set()
AUDIT_LOG: List[Dict[str, Any]] = []


def log_audit_event(action: str, details: Dict[str, Any]):
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "action": action,
        "details": details,
    }
    AUDIT_LOG.append(entry)
    if len(AUDIT_LOG) > 1000:
        AUDIT_LOG.pop(0)


def blacklist_token(e1: str, reason: str = "Forced revocation"):
    TOKEN_BLACKLIST.add(e1)
    log_audit_event("session_blacklisted", {"e1_prefix": e1[:10], "reason": reason})


def is_blacklisted(e1: str) -> bool:
    return e1 in TOKEN_BLACKLIST


# ---------------------------------------------------------------------------
# Setup / Registration Flow (D1 -> E1 / E2 -> DB Hash)
# ---------------------------------------------------------------------------

def generate_transaction_crypto(registry: Optional[KeyRegistry] = None, version: Optional[str] = None) -> Dict[str, str]:
    reg = registry or DEFAULT_KEY_REGISTRY
    keys = reg.get_key_set(version)

    # 1. Generate D1 (32 random bytes CSPRNG) as mutable bytearray for zeroing
    d1 = bytearray(secrets.token_bytes(32))

    try:
        # 2. E1 = AES-128-CBC-Encrypt(K1, random IV, D1)
        iv = secrets.token_bytes(16)
        encrypted_d1 = AES128CBC.encrypt(keys.k1, iv, bytes(d1))
        e1 = f"{keys.version}:{iv.hex()}:{encrypted_d1.hex()}"

        # 3. E2 = HMAC-SHA256(K2, D1)
        e2 = hmac.new(keys.k2, bytes(d1), hashlib.sha256).hexdigest()

        # 5. Secondary DB Hash: PBKDF2-HMAC-SHA256 / bcrypt secondary pass
        salt = secrets.token_bytes(16)
        db_hash_raw = hashlib.pbkdf2_hmac("sha256", e2.encode("utf-8"), salt, 10000)
        e2_db_hash = f"pbkdf2_sha256:10000:{salt.hex()}:{db_hash_raw.hex()}"

        return {
            "e1": e1,
            "e2_hash": e2_db_hash,
            "iv": iv.hex(),
            "key_version": keys.version,
        }
    finally:
        # 6. Zero D1 from memory immediately post-derivation
        for i in range(len(d1)):
            d1[i] = 0


# ---------------------------------------------------------------------------
# Field-Level PII Encryption (K3 AES-128-CBC)
# ---------------------------------------------------------------------------

def encrypt_pii(plaintext: str, registry: Optional[KeyRegistry] = None, version: Optional[str] = None) -> str:
    if not plaintext:
        return ""
    reg = registry or DEFAULT_KEY_REGISTRY
    keys = reg.get_key_set(version)
    iv = secrets.token_bytes(16)
    encrypted = AES128CBC.encrypt(keys.k3, iv, plaintext.encode("utf-8"))
    return f"{keys.version}:{iv.hex()}:{encrypted.hex()}"


def decrypt_pii(encrypted_text: str, registry: Optional[KeyRegistry] = None) -> str:
    if not encrypted_text:
        return ""
    parts = encrypted_text.split(":")
    if len(parts) != 3:
        return encrypted_text  # legacy plaintext fallback
    version, iv_hex, cipher_hex = parts
    reg = registry or DEFAULT_KEY_REGISTRY
    keys = reg.get_key_set(version)
    iv = bytes.fromhex(iv_hex)
    ciphertext = bytes.fromhex(cipher_hex)
    decrypted = AES128CBC.decrypt(keys.k3, iv, ciphertext)
    return decrypted.decode("utf-8")


# ---------------------------------------------------------------------------
# ABIT (Adaptive Interval) & M3 TOTP Flow
# ---------------------------------------------------------------------------

def derive_tz_and_base_interval(e1: str) -> Tuple[int, int]:
    h = hashlib.sha256(e1.encode("utf-8")).digest()
    tz_val = int.from_bytes(h[0:4], byteorder="big", signed=True)
    # tz_offset bounded [-12h, +14h] -> [-43200, +50400]
    tz_offset_seconds = ((abs(tz_val) % 93601) - 43200)

    interval_val = int.from_bytes(h[4:8], byteorder="big", signed=False)
    # base interval: 1 hr (3600s) to 12 hrs (43200s)
    base_interval_seconds = 3600 + (interval_val % (43200 - 3600 + 1))

    return tz_offset_seconds, base_interval_seconds


def assess_risk(context: Optional[Dict[str, Any]] = None) -> Tuple[int, List[str]]:
    ctx = context or {}
    risk_score = 0
    reasons = []

    if ctx.get("impossible_travel"):
        risk_score = 7
        reasons.append("Impossible travel pattern detected")
    else:
        if ctx.get("failed_otp_attempts", 0) >= 3:
            risk_score = max(risk_score, 4)
            reasons.append("Multiple failed OTP attempts (halve 4x)")
        if ctx.get("new_device_fingerprint"):
            risk_score = max(risk_score, 3)
            reasons.append("New device fingerprint (halve 3x)")
        if ctx.get("different_country"):
            risk_score = max(risk_score, 2)
            reasons.append("Different country access (halve 2x)")
        elif ctx.get("different_city_same_country"):
            risk_score = max(risk_score, 1)
            reasons.append("Different city access (halve 1x)")

    if risk_score == 0:
        reasons.append("Known device, normal session (no change)")

    log_audit_event("risk_assessment", {
        "risk_score": risk_score,
        "reasons": reasons,
        "client_ip": ctx.get("client_ip"),
    })
    return risk_score, reasons


def calculate_adaptive_interval(base_interval_seconds: int, risk_score: int) -> int:
    FLOOR_INTERVAL_SECONDS = 300  # 5-minute floor
    reduced = base_interval_seconds // (2 ** risk_score)
    return max(reduced, FLOOR_INTERVAL_SECONDS)


def compute_time_window(current_time_seconds: int, tz_offset_seconds: int, interval_seconds: int) -> int:
    return math.floor((current_time_seconds + tz_offset_seconds) / interval_seconds)


def generate_m3_code(e1: str, t_window: int) -> str:
    return hmac.new(e1.encode("utf-8"), str(t_window).encode("utf-8"), hashlib.sha256).hexdigest()


def generate_m3_session_token(e1: str, risk_score: int = 0, timestamp_seconds: Optional[int] = None) -> Dict[str, Any]:
    current_sec = timestamp_seconds if timestamp_seconds is not None else int(time.time())
    tz_offset_sec, base_interval_sec = derive_tz_and_base_interval(e1)
    interval = calculate_adaptive_interval(base_interval_sec, risk_score)
    t_window = compute_time_window(current_sec, tz_offset_sec, interval)
    code = generate_m3_code(e1, t_window)
    window_start = (t_window * interval) - tz_offset_sec
    expires_at = window_start + interval
    return {
        "code": code,
        "interval": interval,
        "t_window": t_window,
        "expires_at": expires_at,
    }


def verify_m3_session_token(
    e1: str,
    submitted_code: str,
    context: Optional[Dict[str, Any]] = None,
    timestamp_seconds: Optional[int] = None,
) -> Dict[str, Any]:
    if is_blacklisted(e1):
        log_audit_event("session_verification", {"valid": False, "reason": "Blacklisted token"})
        return {"valid": False, "error": "Session token is revoked", "interval": 0, "risk_score": 7}

    current_sec = timestamp_seconds if timestamp_seconds is not None else int(time.time())
    tz_offset_sec, base_interval_sec = derive_tz_and_base_interval(e1)
    risk_score, reasons = assess_risk(context)
    interval = calculate_adaptive_interval(base_interval_sec, risk_score)
    current_t = compute_time_window(current_sec, tz_offset_sec, interval)

    # ±1 window tolerance (T-1, T, T+1)
    candidate_windows = [current_t, current_t - 1, current_t + 1]
    matched = False

    for t in candidate_windows:
        expected = generate_m3_code(e1, t)
        if hmac.compare_digest(submitted_code, expected):
            matched = True
            break

    log_audit_event("session_verification", {
        "valid": matched,
        "risk_score": risk_score,
        "reasons": reasons,
        "interval": interval,
        "t_window": current_t,
    })

    return {
        "valid": matched,
        "error": None if matched else "Invalid or expired session OTP",
        "interval": interval,
        "risk_score": risk_score,
    }
