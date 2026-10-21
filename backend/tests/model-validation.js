
import assert from "node:assert/strict";

import User from "../src/models/User.js";
import Department from "../src/models/Department.js";
import Budget from "../src/models/Budget.js";
import ApprovalPolicy from "../src/models/ApprovalPolicy.js";
import PurchaseRequest from "../src/models/PurchaseRequest.js";
import AuditLog from "../src/models/AuditLog.js";

const runTests = async () => {
  // 1. Check that all six models load.
  assert.ok(User);
  assert.ok(Department);
  assert.ok(Budget);
  assert.ok(ApprovalPolicy);
  assert.ok(PurchaseRequest);
  assert.ok(AuditLog);

  console.log("PASS: All six models imported");

  // 2. Validate a user.
  const user = new User({
    name: "Test Employee",
    email: "employee@example.com",
    passwordHash: "test-hash-only",
  });

  await user.validate();

  assert.deepEqual(user.roles, ["employee"]);
  console.log("PASS: User defaults and validation");

  // 3. Validate a department.
  const department = new Department({
    name: "Engineering",
    code: "eng",
  });

  await department.validate();

  assert.equal(department.code, "ENG");
  console.log("PASS: Department code normalization");

  // 4. Validate a budget.
  const budget = new Budget({
    departmentId: department._id,
    fiscalYear: "2026-27",
    allocatedPaise: 10000000,
  });

  await budget.validate();

  assert.equal(budget.committedPaise, 0);
  assert.equal(budget.remainingPaise, 10000000);
  console.log("PASS: Budget defaults and remaining amount");

  // 5. Validate an approval policy.
  const policy = new ApprovalPolicy({
    name: "Manager Approval",
    minAmountPaise: 0,
    maxAmountPaise: 1000000,
    steps: [
      {
        sequence: 1,
        approverType: "manager",
      },
    ],
  });

  await policy.validate();

  assert.equal(policy.steps.length, 1);
  console.log("PASS: Approval policy validation");

  // 6. Check server-side purchase total calculation.
  const request = new PurchaseRequest({
    requesterId: user._id,
    departmentId: department._id,
    title: "Office Supplies",
    justification: "Required for daily office work",
    quantity: 2,
    unitPricePaise: 15000,
  });

  await request.validate();

  assert.equal(request.totalAmountPaise, 30000);
  assert.equal(request.status, "draft");
  console.log("PASS: Purchase total and default status");

  // 7. Validate an audit event.
  const audit = new AuditLog({
    actorId: user._id,
    action: "REQUEST_CREATED",
    entityType: "PurchaseRequest",
    entityId: request._id,
    requestId: request._id,
  });

  await audit.validate();

  assert.ok(audit.createdAt === undefined);
  console.log("PASS: Audit log validation");

  // 8. Confirm invalid data is rejected.
  const invalidUser = new User({
    name: "A",
    email: "not-an-email",
    passwordHash: "test-hash-only",
  });

  await assert.rejects(() => invalidUser.validate());

  console.log("PASS: Invalid user data rejected");
  console.log("\nAll model validation tests passed!");
};

runTests().catch((error) => {
  console.error("Model validation test failed:", error);
  process.exitCode = 1;
});
