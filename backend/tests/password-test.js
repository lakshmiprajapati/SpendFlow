
import assert from "node:assert/strict";

import {
  hashPassword,
  comparePassword,
} from "../src/utils/password.js";

const runTests = async () => {
  const password = "SpendFlow@2026";

  // Hash the password.
  const passwordHash = await hashPassword(password);

  assert.notEqual(passwordHash, password);
  console.log("PASS: Password is hashed");

  // Verify the correct password.
  assert.equal(
    await comparePassword(password, passwordHash),
    true
  );
  console.log("PASS: Correct password accepted");

  // Reject an incorrect password.
  assert.equal(
    await comparePassword("WrongPassword@123", passwordHash),
    false
  );
  console.log("PASS: Incorrect password rejected");

  // Reject a password that is too short.
  await assert.rejects(
    () => hashPassword("short"),
    /at least 8 characters/
  );
  console.log("PASS: Short password rejected");

  // Reject a password exceeding bcrypt's byte limit.
  await assert.rejects(
    () => hashPassword("a".repeat(73)),
    /72 UTF-8 bytes/
  );
  console.log("PASS: Oversized password rejected");

  // Reject malformed comparison inputs.
  assert.equal(await comparePassword(null, passwordHash), false);
  console.log("PASS: Invalid comparison input rejected");

  console.log("\nAll password tests passed!");
};

runTests().catch((error) => {
  console.error("Password tests failed:", error);
  process.exitCode = 1;
});
