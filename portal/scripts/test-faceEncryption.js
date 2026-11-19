import "dotenv/config";
import { encryptFace, decryptFace } from "../lib/security/faceEncryption.js";

// Simulate a facial descriptor with 128 values
const descriptor = Array(128).fill(0.25);

const encrypted = encryptFace(descriptor);
const decrypted = decryptFace(encrypted);

// Test 1: Data is encrypted
console.log("Test 1 - Encryption:",
    encrypted !== JSON.stringify(descriptor) ? "PASS" : "FAIL");

// Test 2: Data is decrypted correctly
console.log("Test 2 - Decryption:",
    JSON.stringify(decrypted) === JSON.stringify(descriptor)
    ? "PASS" : "FAIL");

// Test 3: Same descriptor produces different ciphertext
const encrypted2 = encryptFace(descriptor);

console.log("Test 3 - Random IV:",
    encrypted !== encrypted2 ? "PASS" : "FAIL");

// Test 4: Detect tampered data
try {
    const [iv, tag, data] = encrypted.split(":");
    const tampered = iv + ":" + tag + ":" +
        (data[0] === "0" ? "1" : "0") + data.slice(1);

    decryptFace(tampered);
    console.log("Test 4 - Tampering: FAIL");
} catch {
    console.log("Test 4 - Tampering: PASS");
}