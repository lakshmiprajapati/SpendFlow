
const MAX_QUANTITY = 100000;
const MAX_UNIT_PRICE_PAISE = Number.MAX_SAFE_INTEGER;

export const validatePurchaseRequestInput = (body) => {
  const errors = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return {
      valid: false,
      errors: ["Request body must be a JSON object"],
    };
  }

  const { title, description, justification, quantity, unitPricePaise } = body;

  if (
    typeof title !== "string" ||
    title.trim().length < 3 ||
    title.trim().length > 150
  ) {
    errors.push("Title must be between 3 and 150 characters");
  }

  if (
    description !== undefined &&
    (typeof description !== "string" || description.length > 3000)
  ) {
    errors.push("Description must not exceed 3000 characters");
  }

  if (
    typeof justification !== "string" ||
    justification.trim().length < 10 ||
    justification.trim().length > 2000
  ) {
    errors.push("Justification must be between 10 and 2000 characters");
  }

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_QUANTITY
  ) {
    errors.push(`Quantity must be an integer from 1 to ${MAX_QUANTITY}`);
  }

  if (
    !Number.isSafeInteger(unitPricePaise) ||
    unitPricePaise < 0 ||
    unitPricePaise > MAX_UNIT_PRICE_PAISE
  ) {
    errors.push("Unit price must be a non-negative integer in paise");
  }

  if (
    Number.isSafeInteger(quantity) &&
    Number.isSafeInteger(unitPricePaise) &&
    quantity >= 1 &&
    unitPricePaise >= 0 &&
    !Number.isSafeInteger(quantity * unitPricePaise)
  ) {
    errors.push("Purchase total exceeds the supported amount range");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
