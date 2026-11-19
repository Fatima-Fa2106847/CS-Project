import {
  generateChallenge,
  hashChallenge,
  getChallengeExpiration,
  isChallengeExpired,
} from "../lib/security/challenges.js";

const challenge1 = generateChallenge();
const challenge2 = generateChallenge();

const hash1 = hashChallenge(challenge1);
const hash2 = hashChallenge(challenge1);

const expiresAt = getChallengeExpiration();
const expiredDate = new Date(Date.now() - 1000);

// Test 1: Random challenges
console.log("Unique challenges:", challenge1 !== challenge2);

// Test 2: Challenge hashing
console.log("Challenge protected:", challenge1 !== hash1);

// Test 3: Consistent hashing
console.log("Hash matches:", hash1 === hash2);

// Test 4: Valid challenge
console.log("Valid challenge:", !isChallengeExpired(expiresAt));

// Test 5: Expired challenge
console.log("Expired challenge rejected:", isChallengeExpired(expiredDate));