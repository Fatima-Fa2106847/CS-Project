import {
  isLocked,
  recordFailedAttempt,
  resetAttempts,
} from "../lib/security/loginAttempts.js";

const email = "security-test@example.com";

// Start with no failed attempts
await resetAttempts(email);

// Test 1: User should not be locked
console.log("TEST 1: Initially unlocked");
console.log((await isLocked(email)) === false ? "PASS" : "FAIL");

// Record 3 failed attempts
await recordFailedAttempt(email);
await recordFailedAttempt(email);
await recordFailedAttempt(email);

// Test 2: User should be locked
console.log("TEST 2: Locked after 3 failures");
console.log((await isLocked(email)) === true ? "PASS" : "FAIL");

// Wait for the 30-second cooldown
console.log("Waiting 31 seconds...");
await new Promise((resolve) => setTimeout(resolve, 31000));

// Test 3: User should be unlocked after cooldown
console.log("TEST 3: Unlocked after 30 seconds");
console.log((await isLocked(email)) === false ? "PASS" : "FAIL");

// Test 4: A new failure should start the counter again
await recordFailedAttempt(email);
console.log("TEST 4: One failure after cooldown");
console.log((await isLocked(email)) === false ? "PASS" : "FAIL");

// Clean up test data
await resetAttempts(email);

console.log("Tests completed!");