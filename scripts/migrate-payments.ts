/**
 * Migration Script: Firestore Payment Records PII Encryption & Crypto Backfill
 *
 * Usage:
 *   npx ts-node scripts/migrate-payments.ts --dry-run
 *   npx ts-node scripts/migrate-payments.ts --live
 *
 * Requirements:
 *   - Encrypts plaintext billing PII fields using K3 (AES-128-CBC)
 *   - Generates D1 CSPRNG for historical session derivation, computes E2 + bcrypt(E2), zeroes D1
 *   - Flags migrated records with keyVersion: "v1" and migratedAt timestamp
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, updateDoc, writeBatch } from "firebase/firestore";
import {
  generateTransactionCrypto,
  encryptBillingAddress,
  decryptBillingAddress,
} from "../lib/paymentEncryption";

const isDryRun = !process.argv.includes("--live");

console.log(`=== Context Fence Payment Migration Script ===`);
console.log(`Mode: ${isDryRun ? "DRY-RUN (no writes performed)" : "LIVE EXECUTION"}`);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

if (!firebaseConfig.projectId) {
  console.error("Error: NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable is missing.");
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migratePayments() {
  console.log("\n1. Scanning `payments` collection...");
  const paymentsSnap = await getDocs(collection(db, "payments"));
  console.log(`Found ${paymentsSnap.size} payment records.`);

  let migratedCount = 0;
  let skippedCount = 0;

  for (const docSnap of paymentsSnap.docs) {
    const data = docSnap.data();
    const billing = data.billing as Record<string, unknown> | undefined;

    // Check if already encrypted (e.g. contains version prefix "v1:")
    const isAlreadyEncrypted =
      data.keyVersion &&
      billing &&
      typeof billing.firstName === "string" &&
      billing.firstName.startsWith("v1:");

    if (isAlreadyEncrypted) {
      skippedCount++;
      continue;
    }

    // Generate transaction crypto (D1 -> E1/E2 -> bcrypt hash, D1 zeroed)
    const cryptoResult = generateTransactionCrypto("v1");

    // Encrypt billing address with K3
    const encryptedBilling = billing ? encryptBillingAddress(billing) : {};

    console.log(`- [${docSnap.id}] Backfilling record for ${data.email || "unknown user"}`);

    if (!isDryRun) {
      await updateDoc(doc(db, "payments", docSnap.id), {
        billing: encryptedBilling,
        e2Hash: cryptoResult.e2Hash,
        keyVersion: "v1",
        iv: cryptoResult.iv,
        migratedAt: new Date().toISOString(),
      });
    }
    migratedCount++;
  }

  console.log(`\nPayments Migration Summary:`);
  console.log(`  - Total scanned: ${paymentsSnap.size}`);
  console.log(`  - Migrated: ${migratedCount}`);
  console.log(`  - Skipped (already encrypted): ${skippedCount}`);
}

async function run() {
  try {
    await migratePayments();
    console.log("\nMigration completed successfully.");
  } catch (err) {
    console.error("\nMigration failed with error:", err);
    process.exit(1);
  }
}

run();
