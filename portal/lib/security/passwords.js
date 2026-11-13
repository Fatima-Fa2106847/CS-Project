import * as argon2 from "argon2";

// Hash Function to protect a password before saving it.
export async function hashPassword(password) {
  return argon2.hash(password, {
    type: argon2.argon2id,
  });
}

// function to check an entered password compared to saved hash
export async function verifyPassword(savedHash, enteredPassword) {
  return argon2.verify(savedHash, enteredPassword);
}