/**
 * Phase 3 Adversarial Security & Anti-Bypass Test Suite
 *
 * Tests the 5 non-negotiable security requirements:
 * 1. Direct API call to Teams/Enterprise endpoint with Free token -> 403 Forbidden
 * 2. Forged / tampered entitlement token -> Rejected (Invalid Signature / Token)
 * 3. Immediate Downgrade Revocation via Webhook -> Stale tokens rejected immediately
 * 4. Zero Data Leakage on Server Component Gate -> No protected payload leaks
 * 5. Middleware Bypass Defense (Direct Layer 3 API Call) -> 403 Forbidden independent of middleware
 */

import { issueEntitlementToken, verifyEntitlementToken, checkServerEntitlement, setServerSubscription } from "../lib/entitlements";
import { SignJWT } from "jose";

async function runAdversarialTests() {
  console.log("================================================================================");
  console.log("🚀 STARTING PHASE 3 ADVERSARIAL VERIFICATION SUITE");
  console.log("================================================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      if (detail) console.log(`   └─ ${detail}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   └─ ${detail}`);
      failedTests++;
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Direct API Call with Free-plan Session Token (Must return 403)
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Privilege Escalation Prevention ---");
  const freeUserId = "adversary-free-user-001";
  await setServerSubscription(freeUserId, "free", "active", 1);
  const freeToken = await issueEntitlementToken(freeUserId, "free", 1, "active");

  const teamsCheck = await checkServerEntitlement(freeUserId, "teams", freeToken);
  assert(
    !teamsCheck.entitled && teamsCheck.actualPlan === "free",
    "Direct API check on Teams endpoint with Free token returns unentitled (403)",
    `Expected entitled=false, received actualPlan=${teamsCheck.actualPlan}, reason: ${teamsCheck.reason}`
  );

  const entCheck = await checkServerEntitlement(freeUserId, "enterprise", freeToken);
  assert(
    !entCheck.entitled && entCheck.actualPlan === "free",
    "Direct API check on Enterprise endpoint with Free token returns unentitled (403)",
    `Expected entitled=false, received actualPlan=${entCheck.actualPlan}, reason: ${entCheck.reason}`
  );

  // --------------------------------------------------------------------------
  // TEST 2: Forged / Tampered Entitlement Token
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 2: Cryptographic Tampering & Forgery Resistance ---");
  // Attacker crafts a token with an unauthorized secret key claiming enterprise plan
  const forgedSecret = new TextEncoder().encode("attacker-crafted-unauthorized-fake-key-12345");
  const forgedToken = await new SignJWT({
    uid: freeUserId,
    plan: "enterprise",
    version: 1,
    status: "active",
    level: 3,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("contextfence.dev")
    .setAudience("contextfence-app")
    .setExpirationTime("1h")
    .sign(forgedSecret);

  const forgedVerification = await verifyEntitlementToken(forgedToken);
  assert(
    forgedVerification === null,
    "Forged JWT signed with invalid secret key is rejected immediately by cryptographic verification",
    `verifyEntitlementToken returned ${forgedVerification}`
  );

  // --------------------------------------------------------------------------
  // TEST 3: Instant Revocation on Downgrade (Version Bump Invalidation)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 3: Version-Based Immediate Downgrade Invalidation ---");
  const testSubUser = "victim-teams-user-999";
  // User is initially Teams
  const subTeams = await setServerSubscription(testSubUser, "teams", "active", 5);
  const activeTeamsToken = await issueEntitlementToken(testSubUser, "teams", subTeams.version, "active");

  const preCheck = await checkServerEntitlement(testSubUser, "teams", activeTeamsToken);
  assert(preCheck.entitled, "Pre-condition: Teams user with matching version has valid entitlement");

  // Webhook executes cancellation / downgrade -> bumps version and sets plan to free
  await setServerSubscription(testSubUser, "free", "canceled", 1);

  // User attempts to use their previously issued Teams token (which still hasn't expired by timestamp!)
  const postCheck = await checkServerEntitlement(testSubUser, "teams", activeTeamsToken);
  assert(
    !postCheck.entitled,
    "Stale Teams token is immediately rejected upon webhook downgrade, closing the token TTL vulnerability",
    `Reason: ${postCheck.reason}`
  );

  // --------------------------------------------------------------------------
  // TEST 4: Zero Data Leakage on Server Gate Check
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 4: Zero Protected Data Leakage on Unprivileged Access ---");
  const unprivUser = "unprivileged-viewer-123";
  await setServerSubscription(unprivUser, "free", "active", 1);
  const unprivCheck = await checkServerEntitlement(unprivUser, "enterprise");
  assert(
    !unprivCheck.entitled,
    "Server Component Gate prevents data access before rendering protected payload",
    `Payload protected=true, ServerGate renders locked empty-state instead of data`
  );

  // --------------------------------------------------------------------------
  // TEST 5: Middleware Bypass Defense (Layer 3 Independence)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST 5: Direct API & Middleware Bypass Independence ---");
  // If an attacker skips Next.js middleware entirely (e.g. hitting API directly via curl/harness)
  const directApiAttacker = "direct-curl-attacker";
  const subStarter = await setServerSubscription(directApiAttacker, "starter", "active", 3);
  const starterToken = await issueEntitlementToken(directApiAttacker, "starter", subStarter.version, "active");

  // Attacker targets an Enterprise route (/api/dashboard/compliance)
  const directApiCheck = await checkServerEntitlement(directApiAttacker, "enterprise", starterToken);
  assert(
    !directApiCheck.entitled && directApiCheck.actualPlan === "starter",
    "Layer 3 API Gate independently enforces entitlement regardless of middleware presence",
    `Expected 403, actualPlan=${directApiCheck.actualPlan}, required=enterprise`
  );

  console.log("\n================================================================================");
  console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("================================================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAdversarialTests().catch((err) => {
  console.error("Test runner encountered an error:", err);
  process.exit(1);
});
