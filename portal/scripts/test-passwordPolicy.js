import assert from "node:assert/strict";
import { validatePassword } from "../lib/security/passwordPolicy.js";

// Test short password
assert.equal(validatePassword("12345").valid, false);
console.log("PASS: Short password rejected.");

// Test common password
assert.equal(validatePassword("password123").valid, false);
console.log("PASS: Common password rejected.");

// Test unsafe password
assert.equal(validatePassword("administrator").valid, false);
console.log("PASS: Unsafe password rejected.");

// Test valid password
assert.equal(validatePassword("MySecurePassword2026").valid, true);
console.log("PASS: Valid password accepted.");

// Test password with spaces
assert.equal(validatePassword("My secure password 2026").valid, true);
console.log("PASS: Password with spaces accepted.");

// Test long password
assert.equal(validatePassword("A".repeat(70)).valid, true);
console.log("PASS: Long password accepted.");

// Test invalid input
assert.equal(validatePassword(12345).valid, false);
console.log("PASS: Invalid input rejected.");

console.log("All password policy tests passed.");