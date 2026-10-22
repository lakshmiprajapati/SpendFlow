
import assert from "node:assert/strict";

import {
  validatePurchaseRequestInput,
} from "../src/utils/requestValidation.js";

const validInput = {
  title: "Office Chairs",
  description: "Chairs for the engineering team",
  justification: "Existing chairs are damaged and need replacement",
  quantity: 2,
  unitPricePaise: 1500000,
};

// 1. Valid input should pass.
const validResult = validatePurchaseRequestInput(validInput);

assert.equal(validResult.valid, true);
assert.deepEqual(validResult.errors, []);
console.log("PASS: Valid purchase request accepted");

// 2. Short title should fail.
const shortTitle = validatePurchaseRequestInput({
  ...validInput,
  title: "AB",
});

assert.equal(shortTitle.valid, false);
console.log("PASS: Invalid title rejected");

// 3. Invalid quantity should fail.
const invalidQuantity = validatePurchaseRequestInput({
  ...validInput,
  quantity: 0,
});

assert.equal(invalidQuantity.valid, false);
console.log("PASS: Invalid quantity rejected");

// 4. Negative price should fail.
const negativePrice = validatePurchaseRequestInput({
  ...validInput,
  unitPricePaise: -100,
});

assert.equal(negativePrice.valid, false);
console.log("PASS: Negative price rejected");

// 5. Decimal quantity should fail.
const decimalQuantity = validatePurchaseRequestInput({
  ...validInput,
  quantity: 1.5,
});

assert.equal(decimalQuantity.valid, false);
console.log("PASS: Decimal quantity rejected");

// 6. Missing justification should fail.
const missingJustification = validatePurchaseRequestInput({
  ...validInput,
  justification: "",
});

assert.equal(missingJustification.valid, false);
console.log("PASS: Missing justification rejected");

// 7. Unsafe total should fail.
const unsafeTotal = validatePurchaseRequestInput({
  ...validInput,
  quantity: 100000,
  unitPricePaise: Number.MAX_SAFE_INTEGER,
});

assert.equal(unsafeTotal.valid, false);
console.log("PASS: Unsafe total rejected");

// 8. Non-object body should fail.
const invalidBody = validatePurchaseRequestInput(null);

assert.equal(invalidBody.valid, false);
console.log("PASS: Invalid request body rejected");

console.log("\nAll request validation tests passed!");
