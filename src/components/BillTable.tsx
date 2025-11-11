"use client";

import { useMemo, useState, useTransition } from "react";
import { diffDays, formatCurrency } from "@/lib/month";
import { togglePaid, updateBillInline, deleteBill } from "@/server/actions";

export type BillRow = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  amountDue: number;
  dueDateISO: string;
  isRecurring: boolean;
  isPaid: boolean;
  month: string;
  bankAccount?: string | null;
  carriedOver?: boolean;
};

export default function BillTable({ bills, month }: { bills: BillRow[]; month: string }) {
  const [pending, start] = useTransition();
  const [local, setLocal] = useState(() => bills);

  // Keep rows sorted: carryovers first, then by due date asc, then unpaid before paid, then by name
  const rows = useMemo(() => {
    const sorted = [...local].sort((a, b) => {
      const aCarry = !!a.carriedOver;
      const bCarry = !!b.carriedOver;
      if (aCarry !== bCarry) return aCarry ? -1 : 1;
      const at = new Date(a.dueDateISO).getTime();
      const bt = new Date(b.dueDateISO).getTime();
      if (at !== bt) return at - bt;
      if (a.isPaid !== b.isPaid) return Number(a.isPaid) - Number(b.isPaid);
      return a.name.localeCompare(b.name);
    });
    return sorted;
  }, [local]);

  function colorFor(b: BillRow): string {
    if (b.isPaid) return "text-green-600";
    const due = new Date(b.dueDateISO);
    const days = diffDays(due, new Date());
    if (days < 0) return "text-red-600";
    if (days <= 3) return "text-amber-600";
    return "text-gray-900";
  }

  function onToggle(id: string) {
    setLocal((ls) => ls.map((r) => (r.id === id ? { ...r, isPaid: !r.isPaid } : r)));
    start(async () => {
      await togglePaid(id, month);
    });
  }

  function onInlineChange(id: string, patch: Partial<Pick<BillRow, "amountDue" | "dueDateISO">>) {
    setLocal((ls) => ls.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function onBlurSave(id: string, data: { amountDue?: number; dueDateISO?: string }) {
    start(async () => {
      await updateBillInline(id, month, {
        amountDue: data.amountDue,
        dueDate: data.dueDateISO?.slice(0, 10),
      });
    });
  }

  return (
    <div className="overflow-x-auto border rounded">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="px-3 py-2">Paid</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Amount</th>
            <th className="px-3 py-2">Due</th>
            <th className="px-3 py-2">Bank</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const due = new Date(b.dueDateISO);
            return (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2 align-middle">
                  <input type="checkbox" checked={b.isPaid} onChange={() => onToggle(b.id)} />
                </td>
                <td className={`px-3 py-2 align-middle ${colorFor(b)}`}>{b.name}</td>
                <td className="px-3 py-2 align-middle text-gray-600">{b.categoryName}</td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="number"
                    step="0.01"
                    className="w-28 border rounded px-2 py-1"
                    value={b.amountDue}
                    onChange={(e) => onInlineChange(b.id, { amountDue: parseFloat(e.target.value || "0") })}
                    onBlur={() => onBlurSave(b.id, { amountDue: b.amountDue })}
                  />
                  <span className="ml-2 text-gray-500">{formatCurrency(b.amountDue)}</span>
                </td>
                <td className="px-3 py-2 align-middle">
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={b.dueDateISO.slice(0, 10)}
                    onChange={(e) => onInlineChange(b.id, { dueDateISO: new Date(e.target.value).toISOString() })}
                    onBlur={() => onBlurSave(b.id, { dueDateISO: b.dueDateISO })}
                  />
                </td>
                <td className="px-3 py-2 align-middle text-gray-600">
                  <select
                    className="border rounded px-2 py-1"
                    value={b.bankAccount ?? ""}
                    onChange={(e) => onInlineChange(b.id, { bankAccount: e.target.value || null } as any)}
                    onBlur={(e) => onBlurSave(b.id, { } as any)}
                    onBlurCapture={(e) =>
                      start(async () => {
                        await updateBillInline(b.id, month, { bankAccount: (e.target as HTMLSelectElement).value || null });
                      })
                    }
                  >
                    <option value="">—</option>
                    <option value="Chase - college">Chase - college</option>
                    <option value="Chase - business">Chase - business</option>
                    <option value="Capital One">Capital One</option>
                  </select>
                </td>
                <td className="px-3 py-2 align-middle text-gray-600">
                  <div className="flex items-center gap-2">
                    <span>{b.isRecurring ? "Recurring" : "One-off"}</span>
                    {b.carriedOver && <span className="text-xs text-amber-600">carried over</span>}
                  </div>
                </td>
                <td className="px-3 py-2 align-middle text-right">
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() =>
                      start(async () => {
                        await deleteBill(b.id, month);
                        setLocal((ls) => ls.filter((r) => r.id !== b.id));
                      })
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pending && <div className="p-2 text-xs text-gray-500">Saving…</div>}
    </div>
  );
}
