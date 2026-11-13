// Modify these:
// Reject common passwords
// Reject Compromised Passwords
// Test Password Policy
// Connect to registrations

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
export function validatePassword(password) {

  // Check input type
  if (typeof password !== "string") {
    return { valid: false, reason: "Password must be a string." };
  }

  // Check password length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, reason: "Password must be at least 10 characters." };
  }

  // Check common passwords
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, reason: "Password is too common." };
  }

  return { valid: true, reason: "Password is valid." };
}