export interface IssueRecord {
  id: string;
  qrCode: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  bookTitle: string;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  status: "issued" | "returned";
  bookImage?: string;
}

export interface IssueInput {
  qrCode: string;
  employeeId: string;
  bookTitle: string;
  bookImage?: string | null;
}

export interface EmployeeInfo {
  name: string;
  designation: string;
}

export type EmployeeDirectory = Record<string, EmployeeInfo>;

export type IssueOutcome =
  | { kind: "success"; record: IssueRecord; message: string }
  | { kind: "error"; message: string };

export type ReturnOutcome =
  | { kind: "success"; record: IssueRecord; records: IssueRecord[]; message: string }
  | { kind: "error"; message: string };

export declare const ISSUE_DURATION_DAYS: number;
export declare function sortRecordsByActivity(records: IssueRecord[]): IssueRecord[];
export declare function issueBook(
  currentRecords: IssueRecord[],
  input: IssueInput,
  employees: EmployeeDirectory,
  options?: { now?: Date },
): IssueOutcome;
export declare function returnBook(
  currentRecords: IssueRecord[],
  qrCode: string,
  options?: { now?: Date },
): ReturnOutcome;
