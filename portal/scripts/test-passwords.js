import assert from "node:assert/strict";
import {hashPassword, verifyPassword,} from "../lib/security/passwords.js";


const password = "Demo-password-only-123";

const hash = await hashPassword(password);

// The stored value must not be the original password.
assert.notEqual(hash, password);
console.log("PASS: Password is stored as a hash.");

// The correct password must be accepted.
assert.equal(await verifyPassword(hash, password), true);
console.log("PASS: Correct password accepted.");

// A wrong password must be rejected.
assert.equal(await verifyPassword(hash, "Wrong-password-123"), false);
console.log("PASS: Wrong password rejected.");

console.log("All password tests passed.");