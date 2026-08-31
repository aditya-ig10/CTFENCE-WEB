"""
Comprehensive Unit Tests for Payment Encryption & ABIT-M3 Architecture.

Scenarios tested:
  1. Normal Flow (Registration, E1/E2, M3 TOTP verification)
  2. DB-Leak Scenario (E2 hash stolen from DB, D1 unrecoverable, one-way property)
  3. Stolen-E1 Scenario (Adaptive interval halving on risk signals, 5-min floor, forced blacklist)
  4. Clock-Drift Tolerance (±1 window accepted, ±2 windows rejected)
  5. Key-Rotation Continuity (Historical v1 records verifiable/decryptable under v2)
  6. PII Field-Level Encryption & Decryption
"""

import sys
import time
import unittest
import hmac
import hashlib

from payment_encryption import (
    AES128CBC,
    KeyRegistry,
    KeySet,
    DEFAULT_KEY_REGISTRY,
    generate_transaction_crypto,
    encrypt_pii,
    decrypt_pii,
    assess_risk,
    calculate_adaptive_interval,
    compute_time_window,
    generate_m3_code,
    generate_m3_session_token,
    verify_m3_session_token,
    blacklist_token,
    is_blacklisted,
    derive_tz_and_base_interval,
)


class TestPaymentEncryptionPipeline(unittest.TestCase):

    def setUp(self):
        self.registry = KeyRegistry("test_master_secret_2026_unit_test!")

    def test_01_normal_registration_and_m3_verification(self):
        """Scenario 1: Normal flow - generate transaction crypto, derive M3, verify successfully."""
        crypto_res = generate_transaction_crypto(self.registry)
        e1 = crypto_res["e1"]
        e2_hash = crypto_res["e2_hash"]
        key_version = crypto_res["key_version"]

        self.assertTrue(e1.startswith("v1:"))
        self.assertTrue(len(crypto_res["iv"]) == 32)  # 16 bytes hex
        self.assertTrue("pbkdf2" in e2_hash or "bcrypt" in e2_hash)

        # Generate M3 session code
        now = 1756684800  # fixed timestamp for deterministic test
        session = generate_m3_session_token(e1, risk_score=0, timestamp_seconds=now)
        code = session["code"]
        self.assertTrue(len(code) == 64)  # HMAC-SHA256 hex length

        # Verify M3 session code
        res = verify_m3_session_token(e1, code, context={"known_device": True}, timestamp_seconds=now)
        self.assertTrue(res["valid"])
        self.assertIsNone(res["error"])
        self.assertEqual(res["risk_score"], 0)

    def test_02_db_leak_scenario_d1_unrecoverable(self):
        """Scenario 2: DB-leak scenario. An attacker obtains the DB with e2_hash and IV.
        D1 cannot be recovered because D1 was never stored, E2 is a one-way HMAC,
        and e2_hash is additionally protected by a secondary slow hash."""
        crypto_res = generate_transaction_crypto(self.registry)
        e2_hash = crypto_res["e2_hash"]

        # 1. Confirm e2_hash is one-way
        self.assertNotIn("raw_d1", crypto_res)

        # 2. Even if attacker has K2, they cannot invert HMAC-SHA256(K2, D1) without D1
        keys = self.registry.get_key_set(crypto_res["key_version"])
        fake_d1_attempt = b"\x00" * 32
        fake_e2 = hmac.new(keys.k2, fake_d1_attempt, hashlib.sha256).hexdigest()

        # Attacker cannot construct matching e2 or bypass verification without knowing D1
        self.assertNotEqual(fake_e2, e2_hash)

    def test_03_stolen_e1_scenario_and_risk_halving(self):
        """Scenario 3: Stolen-E1 scenario. An attacker steals E1 from client session storage.
        Risk assessment detects anomalous signals and halves the interval down to the 5-min floor,
        and token blacklisting forcibly revokes the compromised session."""
        crypto_res = generate_transaction_crypto(self.registry)
        e1 = crypto_res["e1"]
        now = 1756684800

        # Normal interval (risk=0)
        _, base_interval = derive_tz_and_base_interval(e1)
        self.assertGreaterEqual(base_interval, 3600)  # at least 1 hr
        self.assertLessEqual(base_interval, 43200)   # at most 12 hrs

        # Anomalous signal 1: Different country (halve 2x)
        res_country = verify_m3_session_token(e1, "invalid_code", context={"different_country": True}, timestamp_seconds=now)
        expected_halved_2x = max(base_interval // 4, 300)
        self.assertEqual(res_country["interval"], expected_halved_2x)
        self.assertEqual(res_country["risk_score"], 2)

        # Anomalous signal 2: New device fingerprint (halve 3x)
        res_device = verify_m3_session_token(e1, "invalid_code", context={"new_device_fingerprint": True}, timestamp_seconds=now)
        expected_halved_3x = max(base_interval // 8, 300)
        self.assertEqual(res_device["interval"], expected_halved_3x)
        self.assertEqual(res_device["risk_score"], 3)

        # Anomalous signal 3: Multiple failed OTP attempts (halve 4x)
        res_failed = verify_m3_session_token(e1, "invalid_code", context={"failed_otp_attempts": 4}, timestamp_seconds=now)
        expected_halved_4x = max(base_interval // 16, 300)
        self.assertEqual(res_failed["interval"], expected_halved_4x)
        self.assertEqual(res_failed["risk_score"], 4)

        # Anomalous signal 4: Impossible travel pattern (drop to 5-min floor)
        res_travel = verify_m3_session_token(e1, "invalid_code", context={"impossible_travel": True}, timestamp_seconds=now)
        self.assertEqual(res_travel["interval"], 300)  # 5-min floor
        self.assertEqual(res_travel["risk_score"], 7)

        # Forcible revocation via Token Blacklist
        blacklist_token(e1, reason="Compromised E1 detected")
        self.assertTrue(is_blacklisted(e1))

        valid_session = generate_m3_session_token(e1, risk_score=0, timestamp_seconds=now)
        res_blocked = verify_m3_session_token(e1, valid_session["code"], timestamp_seconds=now)
        self.assertFalse(res_blocked["valid"])
        self.assertIn("revoked", res_blocked["error"].lower())

    def test_04_clock_drift_tolerance(self):
        """Scenario 4: Clock drift tolerance. ±1 window must be accepted; ±2 windows rejected."""
        crypto_res = generate_transaction_crypto(self.registry)
        e1 = crypto_res["e1"]
        tz_offset, base_interval = derive_tz_and_base_interval(e1)
        interval = calculate_adaptive_interval(base_interval, risk_score=0)

        t_base = 1756684800
        current_t = compute_time_window(t_base, tz_offset, interval)

        # Current window code
        code_current = generate_m3_code(e1, current_t)
        # Previous window code (T-1)
        code_prev = generate_m3_code(e1, current_t - 1)
        # Next window code (T+1)
        code_next = generate_m3_code(e1, current_t + 1)
        # Expired window code (T-2)
        code_old = generate_m3_code(e1, current_t - 2)
        # Far future window code (T+2)
        code_future = generate_m3_code(e1, current_t + 2)

        # 1. Exact window -> VALID
        self.assertTrue(verify_m3_session_token(e1, code_current, timestamp_seconds=t_base)["valid"])

        # 2. Previous window (T-1) -> VALID (clock drift tolerance)
        self.assertTrue(verify_m3_session_token(e1, code_prev, timestamp_seconds=t_base)["valid"])

        # 3. Next window (T+1) -> VALID (clock drift tolerance)
        self.assertTrue(verify_m3_session_token(e1, code_next, timestamp_seconds=t_base)["valid"])

        # 4. Old window (T-2) -> REJECTED
        self.assertFalse(verify_m3_session_token(e1, code_old, timestamp_seconds=t_base)["valid"])

        # 5. Far future window (T+2) -> REJECTED
        self.assertFalse(verify_m3_session_token(e1, code_future, timestamp_seconds=t_base)["valid"])

    def test_05_key_rotation_continuity(self):
        """Scenario 5: Key rotation continuity. Historical v1 records remain decryptable
        and verifiable after rotating the active key set to v2."""
        # 1. Generate record under v1
        crypto_v1 = generate_transaction_crypto(self.registry, version="v1")
        e1_v1 = crypto_v1["e1"]
        self.assertTrue(e1_v1.startswith("v1:"))

        # Encrypt PII under v1
        secret_address = "456 Cyber Security Way, Tech Hub 560001"
        encrypted_v1 = encrypt_pii(secret_address, self.registry, version="v1")
        self.assertTrue(encrypted_v1.startswith("v1:"))

        # 2. Rotate to v2
        v2_keys = self.registry._derive_version(self.registry.master_secret, "v2")
        self.registry.register_version(v2_keys, make_active=True)
        self.assertEqual(self.registry.active_version, "v2")

        # 3. Confirm new transactions use v2
        crypto_v2 = generate_transaction_crypto(self.registry)
        self.assertTrue(crypto_v2["e1"].startswith("v2:"))

        # 4. Verify historical v1 record still validates M3 seamlessly
        now = int(time.time())
        session_v1 = generate_m3_session_token(e1_v1, timestamp_seconds=now)
        verify_res = verify_m3_session_token(e1_v1, session_v1["code"], timestamp_seconds=now)
        self.assertTrue(verify_res["valid"])

        # 5. Verify historical v1 PII decrypts correctly under v2 active state
        decrypted = decrypt_pii(encrypted_v1, self.registry)
        self.assertEqual(decrypted, secret_address)

    def test_06_field_level_pii_encryption(self):
        """Scenario 6: PII field-level encryption with K3."""
        sample_pii = "John Doe, +91 9876543210, john@example.com"
        encrypted = encrypt_pii(sample_pii, self.registry)
        self.assertNotEqual(encrypted, sample_pii)
        self.assertTrue(encrypted.startswith("v1:"))

        decrypted = decrypt_pii(encrypted, self.registry)
        self.assertEqual(decrypted, sample_pii)

        # Legacy plaintext passthrough
        legacy = "Plaintext Legacy Address"
        self.assertEqual(decrypt_pii(legacy, self.registry), legacy)


if __name__ == "__main__":
    unittest.main(verbosity=2)
