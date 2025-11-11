import Link from "next/link";
import prisma from "@/lib/prisma";
import { ensureMonthGenerated } from "@/server/regenerate";
import { addOneOffBill } from "@/server/actions";
import { nextMonthKey, prevMonthKey, toMonthKey, formatCurrency } from "@/lib/month";
import BillTable from "@/components/BillTable";

type BillDTO = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  amountDue: number;
  dueDateISO: string;
  isRecurring: boolean;
  isPaid: boolean;
  month: string;
};

export const dynamic = "force-dynamic";

export default async function BillsByMonthPage({ params }: { params: { month: string } }) {
  const month = params.month ?? toMonthKey(new Date());
  await ensureMonthGenerated(month);

  const billsRaw = await prisma.bill.findMany({
    where: { month },
    include: { category: true },
    orderBy: [{ isPaid: "asc" }, { dueDate: "asc" }, { name: "asc" }],
  });

  const bills: BillDTO[] = billsRaw.map((b): BillDTO => ({
    id: b.id,
    name: b.name,
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? "",
    amountDue: Number(b.amountDue),
    dueDateISO: b.dueDate.toISOString(),
    isRecurring: b.isRecurring,
    isPaid: b.isPaid,
    month: b.month,
  }));

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });

  const totals = bills.reduce(
    (acc, b) => {
      acc.total += b.amountDue;
      if (b.isPaid) acc.paid += b.amountDue;
      return acc;
    },
    { total: 0, paid: 0 }
  );
  const remaining = totals.total - totals.paid;
  const pct = totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

  const prev = prevMonthKey(month);
  const next = nextMonthKey(month);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link className="px-3 py-2 border rounded" href={`/bills/${prev}`}>&larr; {prev}</Link>
          <h1 className="text-2xl font-semibold">Bills for {month}</h1>
          <Link className="px-3 py-2 border rounded" href={`/bills/${next}`}>{next} &rarr;</Link>
        </div>
        <Link className="text-sm text-gray-600 hover:underline" href="/">Back to Dashboard</Link>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total due</div>
          <div className="text-xl font-semibold">{formatCurrency(totals.total)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-xl font-semibold text-green-600">{formatCurrency(totals.paid)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="text-xl font-semibold text-amber-600">{formatCurrency(remaining)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">% Paid</div>
          <div className="text-xl font-semibold">{pct}%</div>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-green-500 rounded" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="p-4 border rounded">
        <h2 className="font-medium mb-3">Add one-off bill</h2>
           <form action={addOneOffBill} className="grid md:grid-cols-6 gap-3">
          <input name="month" type="hidden" defaultValue={month} />
          <input name="name" className="border rounded px-3 py-2" placeholder="Name" />
          <select name="categoryId" className="border rounded px-3 py-2">
            <option value="">Select category</option>
            {categories.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input name="amountDue" className="border rounded px-3 py-2" placeholder="Amount" type="number" step="0.01" />
          <input name="dueDate" className="border rounded px-3 py-2" type="date" />
              <input name="bankAccount" className="border rounded px-3 py-2" placeholder="Bank (optional)" />
              <button className="bg-black text-white px-4 py-2 rounded md:col-span-6">Add</button>
        </form>
      </section>

          <BillTable month={month} bills={bills.map((b) => ({
            ...b,
            bankAccount: (b as any).bankAccount ?? null,
            carriedOver: (b as any).carriedOver ?? false,
          }))} />
    </div>
  );
}
