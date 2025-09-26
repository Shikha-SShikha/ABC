import {
  ISSUE_DURATION_DAYS,
  issueBook,
  returnBook,
  sortRecordsByActivity,
} from "./libraryLogic.js";

const employees = {
  EMP001: { name: "Test User", designation: "Engineer" },
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

(() => {
  const now = new Date("2024-01-01T00:00:00Z");
  const outcome = issueBook(
    [],
    {
      qrCode: "QR-100",
      employeeId: "emp001",
      bookTitle: "Domain-Driven Design",
      bookImage: "data:image/png;base64,test",
    },
    employees,
    { now },
  );

  assert(outcome.kind === "success", "Expected successful issue");
  if (outcome.kind === "success") {
    assert(outcome.record.qrCode === "QR-100", "QR code mismatch");
    assert(
      outcome.record.dueDate.getTime() === addDays(now, ISSUE_DURATION_DAYS).getTime(),
      "Due date should be 15 days after issue",
    );
  }
})();

(() => {
  const now = new Date("2024-01-02T00:00:00Z");
  const firstIssue = issueBook(
    [],
    {
      qrCode: "QR-200",
      employeeId: "EMP001",
      bookTitle: "Clean Code",
      bookImage: "img",
    },
    employees,
    { now },
  );

  assert(firstIssue.kind === "success", "First issue should succeed");
  const existingRecords = firstIssue.kind === "success" ? [firstIssue.record] : [];
  const secondIssue = issueBook(
    existingRecords,
    {
      qrCode: "QR-200",
      employeeId: "EMP001",
      bookTitle: "Clean Code",
      bookImage: "img",
    },
    employees,
    { now },
  );

  assert(secondIssue.kind === "error", "Duplicate issue should fail");
})();

(() => {
  const now = new Date("2024-01-03T00:00:00Z");
  const issueOutcome = issueBook(
    [],
    {
      qrCode: "QR-300",
      employeeId: "EMP001",
      bookTitle: "Refactoring",
      bookImage: "img",
    },
    employees,
    { now },
  );

  assert(issueOutcome.kind === "success", "Issue should succeed before return");

  const records = issueOutcome.kind === "success" ? [issueOutcome.record] : [];
  const returnOutcome = returnBook(records, "QR-300", { now });

  assert(returnOutcome.kind === "success", "Return should succeed");
  if (returnOutcome.kind === "success") {
    assert(returnOutcome.record.status === "returned", "Returned record should be marked as returned");
    assert(returnOutcome.records[0].returnDate, "Return date should be populated");
  }
})();

(() => {
  const issuedAt = new Date("2024-01-05T09:00:00Z");
  const laterActivity = new Date("2024-01-06T09:00:00Z");

  const firstIssue = issueBook(
    [],
    {
      qrCode: "QR-OLDER",
      employeeId: "EMP001",
      bookTitle: "Working Effectively with Legacy Code",
      bookImage: "img",
    },
    employees,
    { now: issuedAt },
  );

  const secondIssue = issueBook(
    firstIssue.kind === "success" ? [firstIssue.record] : [],
    {
      qrCode: "QR-NEWER",
      employeeId: "EMP001",
      bookTitle: "Design Patterns",
      bookImage: "img",
    },
    employees,
    { now: laterActivity },
  );

  const currentRecords = secondIssue.kind === "success"
    ? sortRecordsByActivity([secondIssue.record, ...(firstIssue.kind === "success" ? [firstIssue.record] : [])])
    : [];

  const returnOutcome = returnBook(currentRecords, "QR-OLDER", { now: laterActivity });

  assert(returnOutcome.kind === "success", "Return should succeed");
  if (returnOutcome.kind === "success") {
    assert(
      returnOutcome.records[0].qrCode === "QR-OLDER",
      "Recently returned record should move to the top of the activity list",
    );
  }
})();

(() => {
  const outcome = issueBook(
    [],
    {
      qrCode: " ",
      employeeId: "EMP001",
      bookTitle: "Some Book",
      bookImage: "img",
    },
    employees,
  );

  assert(outcome.kind === "error", "Blank QR should be rejected");
})();

(() => {
  const outcome = returnBook([], "UNKNOWN");
  assert(outcome.kind === "error", "Returning unknown QR should fail");
})();

console.log("All library logic tests passed");
