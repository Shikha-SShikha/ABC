export const ISSUE_DURATION_DAYS = 15;

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const toTimestamp = (value) => {
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  return 0;
};

const getActivityTimestamp = (record) => {
  return toTimestamp(record.returnDate ?? record.issueDate);
};

const getIssueTimestamp = (record) => {
  return toTimestamp(record.issueDate);
};

export const sortRecordsByActivity = (records) => {
  return [...records].sort((a, b) => {
    const activityDiff = getActivityTimestamp(b) - getActivityTimestamp(a);
    if (activityDiff !== 0) {
      return activityDiff;
    }

    const aReturned = Boolean(a.returnDate);
    const bReturned = Boolean(b.returnDate);
    if (aReturned !== bReturned) {
      return bReturned ? 1 : -1;
    }

    return getIssueTimestamp(b) - getIssueTimestamp(a);
  });
};

export const issueBook = (currentRecords, input, employees, options = {}) => {
  const now = options.now ?? new Date();
  const trimmedQr = input.qrCode.trim();
  const trimmedEmployeeId = input.employeeId.trim().toUpperCase();
  const trimmedBookTitle = input.bookTitle.trim();

  if (!trimmedQr) {
    return {
      kind: "error",
      message: "Please scan or enter a QR code for the book.",
    };
  }

  if (!trimmedEmployeeId) {
    return {
      kind: "error",
      message: "Employee ID is required to issue a book.",
    };
  }

  const employee = employees[trimmedEmployeeId];

  if (!employee) {
    return {
      kind: "error",
      message: "No employee record found for the provided ID.",
    };
  }

  if (!trimmedBookTitle) {
    return {
      kind: "error",
      message: "Please provide the book title before issuing.",
    };
  }

  if (!input.bookImage) {
    return {
      kind: "error",
      message: "Please capture and upload the book image.",
    };
  }

  const alreadyIssued = currentRecords.some(
    (record) => record.qrCode === trimmedQr && record.status === "issued",
  );

  if (alreadyIssued) {
    return {
      kind: "error",
      message: "This QR code is already associated with an active book issue.",
    };
  }

  const issueDate = new Date(now);
  const dueDate = addDays(issueDate, ISSUE_DURATION_DAYS);

  const record = {
    id: `${issueDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    qrCode: trimmedQr,
    employeeId: trimmedEmployeeId,
    employeeName: employee.name,
    designation: employee.designation,
    bookTitle: trimmedBookTitle,
    issueDate,
    dueDate,
    status: "issued",
    bookImage: input.bookImage,
  };

  return {
    kind: "success",
    record,
    message: `${record.bookTitle} issued to ${record.employeeName}. Due on ${dueDate.toDateString()}.`,
  };
};

export const returnBook = (currentRecords, qrCode, options = {}) => {
  const trimmedQr = qrCode.trim();

  if (!trimmedQr) {
    return {
      kind: "error",
      message: "Please scan or enter the book's QR code.",
    };
  }

  const now = options.now ?? new Date();

  const index = currentRecords.findIndex(
    (record) => record.qrCode === trimmedQr && record.status === "issued",
  );

  if (index === -1) {
    return {
      kind: "error",
      message: "No active issued book found for the scanned QR code.",
    };
  }

  const updatedRecord = {
    ...currentRecords[index],
    status: "returned",
    returnDate: new Date(now),
  };

  const updatedRecords = [...currentRecords];
  updatedRecords[index] = updatedRecord;

  return {
    kind: "success",
    record: updatedRecord,
    records: sortRecordsByActivity(updatedRecords),
    message: `${updatedRecord.bookTitle} returned successfully by ${updatedRecord.employeeName}.`,
  };
};

