import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import bcrypt from "bcryptjs";

// ============================================================================
// Payment Encryption & ABIT-M3 Architecture (Phase 1)
//
// Primitives: AES-128-CBC, HMAC-SHA256, bcrypt, crypto.timingSafeEqual.
//
// Variables:
//   D1: 32 random bytes (CSPRNG). Root secret generated per transaction.
//       Discarded & zeroed in memory immediately post-derivation. Never logged or persisted.
//   K1: AES-128 key (versioned) -> E1 = AES-128-CBC(K1, IV, D1)
//   K2: HMAC key (versioned) -> E2 = HMAC-SHA256(K2, D1)
//   K3: AES-128 key (versioned) -> Reversible field-level encryption for PII
//   E2_HASH: bcrypt(E2) stored server-side in DB (defense-in-depth against DB leak)
//   M3: HMAC-SHA256(E1, T) -> Rotating session verification code
//   ABIT: Adaptive interval based on risk signals (0–7), bounded by 5-min floor
// ============================================================================

export interface KeySet {
  version: string;
  k1: Buffer; // 16 bytes (AES-128)
  k2: Buffer; // 32 bytes (HMAC-SHA256)
  k3: Buffer; // 16 bytes (AES-128 for PII)
}

export interface RiskContext {
  knownDevice?: boolean;
  differentCitySameCountry?: boolean;
  differentCountry?: boolean;
  newDeviceFingerprint?: boolean;
  failedOtpAttempts?: number;
  impossibleTravel?: boolean;
  clientIp?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface RiskAssessment {
  riskScore: number; // 0 to 7
  reasons: string[];
  assessedAt: number;
}

export interface TransactionCryptoResult {
  e1: string; // Serialized ciphertext: version:iv_hex:ciphertext_hex
  e2Hash: string; // bcrypt hash of E2 for DB write
  iv: string; // Hex IV used for E1
  keyVersion: string;
}

export interface AuditLogEntry {
  timestamp: string;
  action: "risk_assessment" | "session_verification" | "session_blacklisted" | "refund_decision";
  details: Record<string, unknown>;
}

// In-memory blacklist for forcibly revoked tokens / sessions
const TOKEN_BLACKLIST = new Set<string>();

// In-memory audit log ring buffer (retained for review / audit inspection)
const AUDIT_LOG: AuditLogEntry[] = [];
const MAX_AUDIT_LOGS = 1000;

export function logAuditEvent(
  action: AuditLogEntry["action"],
  details: Record<string, unknown>
): void {
  const entry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
  };
  AUDIT_LOG.push(entry);
  if (AUDIT_LOG.length > MAX_AUDIT_LOGS) {
    AUDIT_LOG.shift();
  }
}

export function getAuditLogs(): ReadonlyArray<AuditLogEntry> {
  return AUDIT_LOG;
}

// ----------------------------------------------------------------------------
// Key Registry & Versioning
// ----------------------------------------------------------------------------

function deriveKeysFromSeed(seed: string, version: string): KeySet {
  const master = createHash("sha256").update(`${seed}:${version}`).digest();
  const k1 = createHash("sha256").update(Buffer.concat([master, Buffer.from("K1_AES128")])).digest().subarray(0, 16);
  const k2 = createHash("sha256").update(Buffer.concat([master, Buffer.from("K2_HMAC256")])).digest();
  const k3 = createHash("sha256").update(Buffer.concat([master, Buffer.from("K3_PII_AES128")])).digest().subarray(0, 16);
  return { version, k1, k2, k3 };
}

const DEFAULT_SECRET = process.env.PAYMENT_MASTER_SECRET || process.env.RAZORPAY_KEY_SECRET || "cf_default_master_sec_2026_x!";
const KEY_REGISTRY = new Map<string, KeySet>();

// Register default v1 key set
KEY_REGISTRY.set("v1", deriveKeysFromSeed(DEFAULT_SECRET, "v1"));

let ACTIVE_KEY_VERSION = "v1";

export function registerKeyVersion(keySet: KeySet, makeActive = false): void {
  KEY_REGISTRY.set(keySet.version, keySet);
  if (makeActive) {
    ACTIVE_KEY_VERSION = keySet.version;
  }
}

export function getKeySet(version = ACTIVE_KEY_VERSION): KeySet {
  const keys = KEY_REGISTRY.get(version);
  if (!keys) {
    const fallback = deriveKeysFromSeed(DEFAULT_SECRET, version);
    KEY_REGISTRY.set(version, fallback);
    return fallback;
  }
  return keys;
}

// ----------------------------------------------------------------------------
// Transaction Registration / Setup Flow (D1 -> E1 / E2 -> bcrypt)
// ----------------------------------------------------------------------------

/**
 * Generates root secret D1 (32 bytes CSPRNG), derives E1 and E2,
 * computes secondary bcrypt hash of E2, and strictly zeroes D1 from memory.
 */
export function generateTransactionCrypto(version = ACTIVE_KEY_VERSION): TransactionCryptoResult {
  const keys = getKeySet(version);

  // 1. Generate D1 (32 random bytes CSPRNG)
  const d1 = randomBytes(32);

  try {
    // 2. E1 = AES-128-CBC-Encrypt(K1, random IV, D1)
    const iv = randomBytes(16);
    const cipher = createCipheriv("aes-128-cbc", keys.k1, iv);
    const encryptedD1 = Buffer.concat([cipher.update(d1), cipher.final()]);
    const e1 = `${keys.version}:${iv.toString("hex")}:${encryptedD1.toString("hex")}`;

    // 3. E2 = HMAC-SHA256(K2, D1)
    const e2 = createHmac("sha256", keys.k2).update(d1).digest("hex");

    // 5. Store E2 + IV + key-version ID. E2 is re-hashed with bcrypt before DB write.
    const e2Hash = bcrypt.hashSync(e2, 10);

    return {
      e1,
      e2Hash,
      iv: iv.toString("hex"),
      keyVersion: keys.version,
    };
  } finally {
    // 6. Zero D1 from memory immediately post-derivation.
    d1.fill(0);
  }
}

// ----------------------------------------------------------------------------
// Field-Level PII Encryption (K3 AES-128-CBC)
// ----------------------------------------------------------------------------

/**
 * Encrypts a string (e.g. customer name, phone, address) with K3.
 * Output format: version:iv_hex:ciphertext_hex
 */
export function encryptPII(plaintext: string, version = ACTIVE_KEY_VERSION): string {
  if (!plaintext) return "";
  const keys = getKeySet(version);
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-128-cbc", keys.k3, iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(plaintext, "utf8")), cipher.final()]);
  return `${keys.version}:${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a K3-encrypted string back to plaintext.
 */
export function decryptPII(encryptedText: string): string {
  if (!encryptedText) return "";
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    // Return as-is if not formatted as ciphertext (e.g. legacy plaintext)
    return encryptedText;
  }
  const [version, ivHex, cipherHex] = parts;
  const keys = getKeySet(version);
  const iv = Buffer.from(ivHex, "hex");
  const cipherBuffer = Buffer.from(cipherHex, "hex");
  const decipher = createDecipheriv("aes-128-cbc", keys.k3, iv);
  const decrypted = Buffer.concat([decipher.update(cipherBuffer), decipher.final()]);
  return decrypted.toString("utf8");
}

/**
 * Encrypts all sensitive fields of a billing address object with K3.
 */
export function encryptBillingAddress<T extends Record<string, unknown>>(billing: T): Record<string, unknown> {
  const result: Record<string, unknown> = { ...billing };
  const sensitiveFields = [
    "firstName",
    "lastName",
    "phone",
    "phoneCode",
    "address1",
    "address2",
    "city",
    "state",
    "postal",
    "company",
  ];

  for (const field of sensitiveFields) {
    if (typeof billing[field] === "string" && billing[field]) {
      result[field] = encryptPII(billing[field] as string);
    }
  }
  return result;
}

/**
 * Decrypts all sensitive fields of a billing address object with K3.
 */
export function decryptBillingAddress<T extends Record<string, unknown>>(billing: T): Record<string, unknown> {
  const result: Record<string, unknown> = { ...billing };
  const sensitiveFields = [
    "firstName",
    "lastName",
    "phone",
    "phoneCode",
    "address1",
    "address2",
    "city",
    "state",
    "postal",
    "company",
  ];

  for (const field of sensitiveFields) {
    if (typeof billing[field] === "string" && billing[field]) {
      result[field] = decryptPII(billing[field] as string);
    }
  }
  return result;
}

// ----------------------------------------------------------------------------
// ABIT (Adaptive Interval) & M3 TOTP Flow
// ----------------------------------------------------------------------------

/**
 * Derives deterministic timezone offset and base interval (1–12h) from SHA256(E1).
 */
export function deriveTzAndBaseInterval(e1: string): {
  tzOffsetSeconds: number;
  baseIntervalSeconds: number;
} {
  const hash = createHash("sha256").update(e1).digest();
  const tzVal = hash.readInt32BE(0);
  const tzOffsetSeconds = ((Math.abs(tzVal) % 93601) - 43200);

  const intervalVal = hash.readUInt32BE(4);
  const baseIntervalSeconds = 3600 + (intervalVal % (43200 - 3600 + 1));

  return { tzOffsetSeconds, baseIntervalSeconds };
}

/**
 * Real signal risk assessment engine (0 to 7 score).
 */
export function assessRisk(context: RiskContext = {}): RiskAssessment {
  let riskScore = 0;
  const reasons: string[] = [];

  if (context.impossibleTravel) {
    riskScore = 7;
    reasons.push("Impossible travel pattern detected");
  } else {
    if (context.failedOtpAttempts && context.failedOtpAttempts >= 3) {
      riskScore = Math.max(riskScore, 4);
      reasons.push("Multiple failed OTP attempts (halve 4x)");
    }
    if (context.newDeviceFingerprint) {
      riskScore = Math.max(riskScore, 3);
      reasons.push("New device fingerprint (halve 3x)");
    }
    if (context.differentCountry) {
      riskScore = Math.max(riskScore, 2);
      reasons.push("Different country access (halve 2x)");
    } else if (context.differentCitySameCountry) {
      riskScore = Math.max(riskScore, 1);
      reasons.push("Different city access (halve 1x)");
    }
  }

  if (riskScore === 0) {
    reasons.push("Known device, normal session (no change)");
  }

  const assessment: RiskAssessment = {
    riskScore,
    reasons,
    assessedAt: Date.now(),
  };

  logAuditEvent("risk_assessment", {
    riskScore,
    reasons,
    clientIp: context.clientIp,
    userAgent: context.userAgent,
  });

  return assessment;
}

/**
 * Computes the ABIT-adaptive interval for a session.
 * interval = max(base_interval / 2^r, 5 min)
 */
export function calculateAdaptiveInterval(baseIntervalSeconds: number, riskScore: number): number {
  const FLOOR_INTERVAL_SECONDS = 300; // 5 min floor
  const reduced = Math.floor(baseIntervalSeconds / Math.pow(2, riskScore));
  return Math.max(reduced, FLOOR_INTERVAL_SECONDS);
}

/**
 * Computes T counter: T = floor((t + tz_offset) / interval)
 */
export function computeTimeWindow(currentTimeSeconds: number, tzOffsetSeconds: number, intervalSeconds: number): number {
  return Math.floor((currentTimeSeconds + tzOffsetSeconds) / intervalSeconds);
}

/**
 * Computes M3 session verification code: M3 = HMAC-SHA256(E1, T)
 */
export function generateM3Code(e1: string, tWindow: number): string {
  return createHmac("sha256", e1).update(tWindow.toString()).digest("hex");
}

/**
 * Client/Server M3 generation helper with ABIT support.
 */
export function generateM3SessionToken(
  e1: string,
  riskScore = 0,
  timestampMs = Date.now()
): { code: string; interval: number; tWindow: number; expiresAtMs: number } {
  const { tzOffsetSeconds, baseIntervalSeconds } = deriveTzAndBaseInterval(e1);
  const interval = calculateAdaptiveInterval(baseIntervalSeconds, riskScore);
  const currentSec = Math.floor(timestampMs / 1000);
  const tWindow = computeTimeWindow(currentSec, tzOffsetSeconds, interval);
  const code = generateM3Code(e1, tWindow);
  const windowStartSec = (tWindow * interval) - tzOffsetSeconds;
  const expiresAtMs = (windowStartSec + interval) * 1000;

  return { code, interval, tWindow, expiresAtMs };
}

/**
 * Constant-time string / buffer equality comparison.
 */
export function constantTimeEquals(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Verifies submitted M3 code against E1 with ABIT interval and ±1 window drift tolerance.
 */
export function verifyM3SessionToken(
  e1: string,
  submittedCode: string,
  context: RiskContext = {},
  timestampMs = Date.now()
): { valid: boolean; error?: string; intervalSeconds: number; riskScore: number } {
  if (TOKEN_BLACKLIST.has(e1)) {
    logAuditEvent("session_verification", { valid: false, reason: "Session token is blacklisted", e1Snippet: e1.slice(0, 10) });
    return { valid: false, error: "Session token is revoked", intervalSeconds: 0, riskScore: 7 };
  }

  const { tzOffsetSeconds, baseIntervalSeconds } = deriveTzAndBaseInterval(e1);
  const { riskScore, reasons } = assessRisk(context);
  const interval = calculateAdaptiveInterval(baseIntervalSeconds, riskScore);
  const currentSec = Math.floor(timestampMs / 1000);
  const currentT = computeTimeWindow(currentSec, tzOffsetSeconds, interval);

  // Check ±1 window drift tolerance (T-1, T, T+1)
  const candidateWindows = [currentT, currentT - 1, currentT + 1];
  let matched = false;

  for (const t of candidateWindows) {
    const expected = generateM3Code(e1, t);
    if (constantTimeEquals(submittedCode, expected)) {
      matched = true;
      break;
    }
  }

  logAuditEvent("session_verification", {
    valid: matched,
    riskScore,
    reasons,
    intervalSeconds: interval,
    tWindow: currentT,
  });

  return {
    valid: matched,
    error: matched ? undefined : "Invalid or expired session OTP",
    intervalSeconds: interval,
    riskScore,
  };
}

/**
 * Blacklists an E1 session token immediately.
 */
export function blacklistSessionToken(e1: string, reason = "Forced revocation"): void {
  TOKEN_BLACKLIST.add(e1);
  logAuditEvent("session_blacklisted", { e1Snippet: e1.slice(0, 10), reason });
}

export function isSessionBlacklisted(e1: string): boolean {
  return TOKEN_BLACKLIST.has(e1);
}
