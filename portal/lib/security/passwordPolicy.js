// Minimum password length
const MIN_PASSWORD_LENGTH = 10;

// Common and unsafe passwords
const commonPasswords = [
  "password",
  "password123",
  "1234567890",
  "123456789",
  "qwerty12345",
  "admin123456",
  "letmein123",
  "welcome123",
  "12345678910",
  "iloveyou123",
  "qwerty123456",
  "password1234",
  "123456789123",
  "administrator",
  "welcome1234",
];

// Check if the password is valid
function validatePassword(password) {

  // Check input type
  if (typeof password !== "string") {
    return {
      valid: false,
      reason: "Password must be a string.",
    };
  }

  // Check password length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      reason: "Password must be at least 10 characters.",
    };
  }

  // Check common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    return {
      valid: false,
      reason: "Password is too common.",
    };
  }

  return {
    valid: true,
    reason: "Password is valid.",
  };
}
const { createHash } = require("node:crypto");

// Check if a password appeared in a known data breach
async function isPasswordCompromised(password) {
  const hash = createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();

  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  // Send only the first 5 characters of the hash
  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    {
      headers: {
        "Add-Padding": "true",
      },
      signal: AbortSignal.timeout(5000),
    }
  );

  if (!response.ok) {
    throw new Error("Password breach check failed.");
  }

  const results = await response.text();

  return results.split("\n").some((line) => {
    const [returnedSuffix, count] = line.trim().split(":");

    return returnedSuffix === suffix && Number(count) > 0;
  });
}
// Export the function
module.exports = {
  validatePassword,
  isPasswordCompromised,
};