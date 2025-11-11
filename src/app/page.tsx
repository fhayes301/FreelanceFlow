import Link from "next/link";
import prisma from "@/lib/prisma";
import { ensureMonthGenerated } from "@/server/regenerate";
import { toMonthKey, formatCurrency, formatMonthKeyMMYYYY } from "@/lib/month";
import NewBillModal from "@/components/NewBillModal";
import NewTemplateModal from "@/components/NewTemplateModal";
import BillTable from "@/components/BillTable";
import { deleteTemplate } from "@/server/actions";

export const dynamic = "force-dynamic";

export default async function Home() {
  const nowKey = toMonthKey(new Date());
  await ensureMonthGenerated(nowKey);

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const templates = await prisma.billTemplate.findMany({ include: { category: true }, orderBy: { name: "asc" } });
  const billsCurrent = await prisma.bill.findMany({
    where: { month: nowKey },
    include: { category: true },
    orderBy: [{ isPaid: "asc" }, { dueDate: "asc" }, { name: "asc" }],
  });

  const unpaidPast = await prisma.bill.findMany({
    where: {
      isPaid: false,
      month: { lt: nowKey },
      carriedOverChildren: { none: { month: nowKey } },
    },
    include: { category: true },
    orderBy: [{ dueDate: "asc" }, { name: "asc" }],
  });

  const bills = [...billsCurrent, ...unpaidPast];

  // Sort with carryovers (past months OR marked carriedOver) first, then by due date ascending, then unpaid before paid, then by name
  const billsSorted = [...bills].sort((a, b) => {
    const aCarry = (a as any).carriedOver === true || a.month !== nowKey;
    const bCarry = (b as any).carriedOver === true || b.month !== nowKey;
    if (aCarry !== bCarry) return aCarry ? -1 : 1;
    const aTime = a.dueDate instanceof Date ? a.dueDate.getTime() : new Date(a.dueDate as unknown as string).getTime();
    const bTime = b.dueDate instanceof Date ? b.dueDate.getTime() : new Date(b.dueDate as unknown as string).getTime();
    if (aTime !== bTime) return aTime - bTime;
    if (a.isPaid !== b.isPaid) return Number(a.isPaid) - Number(b.isPaid);
    return a.name.localeCompare(b.name);
  });

  const total = bills.reduce((acc, b) => acc + Number(b.amountDue), 0);
  const paid = bills.filter((b) => b.isPaid).reduce((acc, b) => acc + Number(b.amountDue), 0);
  const remaining = total - paid;
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Amount due in the next seven days (unpaid only)
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sevenDaysOut = new Date(startOfToday);
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const nextSevenTotal = bills
    .filter((b) => !b.isPaid && b.dueDate >= startOfToday && b.dueDate <= sevenDaysOut)
    .reduce((acc, b) => acc + Number(b.amountDue), 0);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Freelance Flow</h1>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link className="hover:underline" href={`/bills/${nowKey}`}>This month</Link>
          <Link className="hover:underline" href="/categories">Categories</Link>
        </nav>
      </header>

      <div className="flex items-center gap-3">
        <NewBillModal month={nowKey} categories={categories} />
        <NewTemplateModal categories={categories} />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Total due</div>
          <div className="text-xl font-semibold">{formatCurrency(total)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Paid</div>
          <div className="text-xl font-semibold text-green-600">{formatCurrency(paid)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="text-xl font-semibold text-amber-600">{formatCurrency(remaining)}</div>
          <div className="h-2 bg-gray-200 rounded mt-2">
            <div className="h-2 bg-green-500 rounded" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </section>

      <section className="p-4 border rounded">
        <div className="text-sm text-gray-500">Amount due in next seven days</div>
        <div className="text-xl font-semibold text-amber-700">{formatCurrency(nextSevenTotal)}</div>
      </section>

      {/* {templates.length > 0 && (
        <section className="p-4 border rounded">
          <h3 className="font-medium text-sm mb-2">Templates</h3>
          <ul className="divide-y">
            {templates.map((t) => (
              <li key={t.id} className="py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900">{t.name}</span>
                  <span className="text-gray-500">({t.category?.name ?? ""})</span>
                </div>
                <form action={async () => { "use server"; await deleteTemplate(t.id, nowKey); }}>
                  <button type="submit" className="text-red-600 hover:underline">Delete</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )} */}

      <section className="p-4 border rounded">
        <h2 className="font-medium mb-2">Bills — {formatMonthKeyMMYYYY(nowKey)}</h2>
        <BillTable
          month={nowKey}
          bills={billsSorted.map((b) => ({
            id: b.id,
            name: b.name,
            categoryId: b.categoryId,
            categoryName: b.category?.name ?? "",
            amountDue: Number(b.amountDue),
            dueDateISO: b.dueDate.toISOString(),
            isRecurring: b.isRecurring,
            isPaid: b.isPaid,
            month: b.month,
            bankAccount: (b as any).bankAccount ?? null,
            // Mark any bill from a prior month as carried over for dashboard context
            carriedOver: b.month !== nowKey ? true : ((b as any).carriedOver ?? false),
          }))}
        />
      </section>
    </div>
  );
}
