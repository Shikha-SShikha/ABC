import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ISSUE_DURATION_DAYS,
  type IssueRecord,
  issueBook,
  returnBook,
  sortRecordsByActivity,
} from "./libraryLogic";

interface IssueFormState {
  qrCode: string;
  employeeId: string;
  bookTitle: string;
  bookImagePreview: string | null;
  bookImageName: string;
}

const employees: Record<string, { name: string; designation: string }> = {
  "EMP001": { name: "Aarav Natarajan", designation: "Senior Analyst" },
  "EMP002": { name: "Meera Iyer", designation: "Data Scientist" },
  "EMP003": { name: "Rahul Verma", designation: "Product Manager" },
  "EMP004": { name: "Divya Krishnan", designation: "UX Researcher" },
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const initialIssueForm: IssueFormState = {
  qrCode: "",
  employeeId: "",
  bookTitle: "",
  bookImagePreview: null,
  bookImageName: "",
};

export default function Home() {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<IssueFormState>(initialIssueForm);
  const [issueRecords, setIssueRecords] = useState<IssueRecord[]>([]);
  const [returnQrCode, setReturnQrCode] = useState("");
  const [bannerMessage, setBannerMessage] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  const matchedEmployee = useMemo(() => {
    const trimmedId = issueForm.employeeId.trim().toUpperCase();
    return trimmedId ? employees[trimmedId] ?? null : null;
  }, [issueForm.employeeId]);

  const totalIssued = useMemo(
    () => issueRecords.filter((record) => record.status === "issued").length,
    [issueRecords],
  );

  const overdueCount = useMemo(
    () =>
      issueRecords.filter(
        (record) => record.status === "issued" && record.dueDate < new Date(),
      ).length,
    [issueRecords],
  );

  const returnedToday = useMemo(() => {
    const today = new Date();
    return issueRecords.filter((record) => {
      if (!record.returnDate) return false;
      return (
        record.returnDate.getDate() === today.getDate() &&
        record.returnDate.getMonth() === today.getMonth() &&
        record.returnDate.getFullYear() === today.getFullYear()
      );
    }).length;
  }, [issueRecords]);

  const handleIssueDialogChange = (open: boolean) => {
    setIssueDialogOpen(open);
    if (!open) {
      setIssueForm(initialIssueForm);
    }
  };

  const handleReturnDialogChange = (open: boolean) => {
    setReturnDialogOpen(open);
    if (!open) {
      setReturnQrCode("");
    }
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setIssueForm((prev) => ({
        ...prev,
        bookImagePreview: null,
        bookImageName: "",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setIssueForm((prev) => ({
        ...prev,
        bookImagePreview: typeof reader.result === "string" ? reader.result : null,
        bookImageName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleIssueSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const outcome = issueBook(
      issueRecords,
      {
        qrCode: issueForm.qrCode,
        employeeId: issueForm.employeeId,
        bookTitle: issueForm.bookTitle,
        bookImage: issueForm.bookImagePreview,
      },
      employees,
    );

    if (outcome.kind === "error") {
      setBannerMessage({ type: "error", message: outcome.message });
      return;
    }

    setIssueRecords((prev) => sortRecordsByActivity([outcome.record, ...prev]));
    setBannerMessage({ type: "success", message: outcome.message });
    handleIssueDialogChange(false);
  };

  const handleReturnSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const outcome = returnBook(issueRecords, returnQrCode);

    if (outcome.kind === "error") {
      setBannerMessage({ type: "error", message: outcome.message });
      return;
    }

    setIssueRecords(sortRecordsByActivity(outcome.records));
    setBannerMessage({ type: "success", message: outcome.message });
    handleReturnDialogChange(false);
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900">Library Issuing Desk</h1>
          <p className="text-slate-600 max-w-2xl">
            Scan your QR code to issue or return books seamlessly. Every book is issued for
            15 days and overdue titles are highlighted automatically.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {bannerMessage ? (
          <div
            className={`rounded-lg border px-4 py-3 text-sm font-medium ${
              bannerMessage.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {bannerMessage.message}
          </div>
        ) : null}

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Issue a Book</h2>
                <p className="text-sm text-slate-600">
                  Start by scanning the shelf QR code. Confirm the employee's details and capture the
                  book cover to complete the issuing process.
                </p>
              </div>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setIssueDialogOpen(true)}
              >
                Scan QR to Issue
              </Button>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Employee name and designation appear automatically from their ID.</li>
                <li>• The return due date is always 15 days from the issue date.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Return a Book</h2>
                <p className="text-sm text-slate-600">
                  Scan the same QR code when the book is brought back. The system instantly marks it
                  as returned.
                </p>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setReturnDialogOpen(true)}
              >
                Scan QR to Return
              </Button>
              <p className="text-xs text-slate-500">
                Overdue books (beyond 15 days) are flagged in the dashboard below for quick action.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Active Issues</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">{totalIssued}</p>
              <p className="text-xs text-slate-500 mt-1">Books currently with employees</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Overdue</p>
              <p className="mt-2 text-3xl font-semibold text-red-600">{overdueCount}</p>
              <p className="text-xs text-slate-500 mt-1">Need follow-up</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Returned Today</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">{returnedToday}</p>
              <p className="text-xs text-slate-500 mt-1">Books checked back in</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Book Activity</h2>
            <span className="text-xs text-slate-500">Newest entries appear first</span>
          </div>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <ScrollArea className="max-h-[420px]">
                <div className="divide-y divide-slate-200">
                  {issueRecords.length === 0 ? (
                    <div className="p-8 text-center text-sm text-slate-500">
                      No book activity recorded yet. Use the buttons above to issue or return a book.
                    </div>
                  ) : (
                    issueRecords.map((record) => {
                      const isOverdue =
                        record.status === "issued" && record.dueDate < new Date();

                      return (
                        <div key={record.id} className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
                          <div className="flex items-start gap-4">
                            {record.bookImage ? (
                              <img
                                src={record.bookImage}
                                alt={`${record.bookTitle} cover`}
                                className="h-20 w-16 rounded-md object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="h-20 w-16 rounded-md border border-dashed border-slate-300 bg-slate-50" />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{record.bookTitle}</h3>
                              <p className="text-sm text-slate-600">
                                {record.employeeName} · {record.designation}
                              </p>
                              <div className="mt-2 space-y-1 text-xs text-slate-500">
                                <p>Issued: {formatDate(record.issueDate)}</p>
                                <p>
                                  Due: <span className={isOverdue ? "text-red-600 font-semibold" : ""}>{formatDate(record.dueDate)}</span>
                                </p>
                                {record.returnDate ? (
                                  <p>Returned: {formatDate(record.returnDate)}</p>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start gap-2 md:items-end">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                                record.status === "issued"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {record.status === "issued" ? "Issued" : "Returned"}
                            </span>
                            {isOverdue ? (
                              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                Overdue
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
      </main>

      <Dialog open={issueDialogOpen} onOpenChange={handleIssueDialogChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Scan QR to Issue</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="qr-code">
                Book QR Code
              </label>
              <Input
                id="qr-code"
                placeholder="Auto-filled after scanning"
                value={issueForm.qrCode}
                onChange={(event) =>
                  setIssueForm((prev) => ({ ...prev, qrCode: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="employee-id">
                Employee ID
              </label>
              <Input
                id="employee-id"
                placeholder="e.g. EMP001"
                value={issueForm.employeeId}
                onChange={(event) =>
                  setIssueForm((prev) => ({ ...prev, employeeId: event.target.value }))
                }
              />
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">
                {matchedEmployee ? (
                  <div>
                    <p className="font-semibold text-slate-900">{matchedEmployee.name}</p>
                    <p>{matchedEmployee.designation}</p>
                  </div>
                ) : issueForm.employeeId.trim() ? (
                  <p className="text-red-600">No employee found for this ID.</p>
                ) : (
                  <p>Enter an employee ID to fetch the name and designation automatically.</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="book-title">
                Book Title
              </label>
              <Input
                id="book-title"
                placeholder="e.g. Clean Code"
                value={issueForm.bookTitle}
                onChange={(event) =>
                  setIssueForm((prev) => ({ ...prev, bookTitle: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="book-image">
                Capture Book Cover
              </label>
              <Input id="book-image" type="file" accept="image/*" onChange={handleImageChange} />
              {issueForm.bookImagePreview ? (
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <img
                    src={issueForm.bookImagePreview}
                    alt="Book preview"
                    className="h-16 w-12 rounded object-cover"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700">Preview ready</p>
                    <p className="text-xs text-slate-500 truncate">{issueForm.bookImageName}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Upload a clear picture of the book for verification.</p>
              )}
            </div>

            <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
              This book will be due on <strong>{formatDate(addDays(new Date(), ISSUE_DURATION_DAYS))}</strong>.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700"
                onClick={() => handleIssueDialogChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Issue Book
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={handleReturnDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR to Return</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReturnSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="return-qr-code">
                Book QR Code
              </label>
              <Input
                id="return-qr-code"
                placeholder="Auto-filled after scanning"
                value={returnQrCode}
                onChange={(event) => setReturnQrCode(event.target.value)}
              />
            </div>
            <p className="text-xs text-slate-500">
              Use the same QR code that was used during issuing. The system will automatically match
              the record and mark the book as returned.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300 text-slate-700"
                onClick={() => handleReturnDialogChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                Mark as Returned
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
