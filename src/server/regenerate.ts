"use server";

import prisma from "@/lib/prisma";
import type { Bill, BillTemplate } from "@/generated/prisma/client";
import { clampDay, parseMonthKey, toMonthKey } from "@/lib/month";

export async function ensureMonthGenerated(targetKey?: string) {
  // Ensure bills exist for the current month; if targetKey provided, use that
  const now = new Date();
  const monthKey = targetKey ?? toMonthKey(now);

  // Check if month already has any bills
  const exists = await prisma.bill.findFirst({ where: { month: monthKey } });

  // 1) Generate from active templates
  const templates = await prisma.billTemplate.findMany({ where: { isActive: true } });
  const { year, month } = parseMonthKey(monthKey);
  const templateRows = templates.map((t: BillTemplate) => {
    const day = clampDay(year, month, t.dueDayDefault);
    const due = new Date(year, month - 1, day);
    return {
      name: t.name,
      categoryId: t.categoryId,
      templateId: t.id,
      amountDue: Number(t.amountDefault),
      dueDate: due,
      isRecurring: true,
      isPaid: false,
      month: monthKey,
      bankAccount: (t as any).bankAccountDefault ?? null,
      carriedOver: false,
    };
  });

  if (!exists) {
    // First-time generation for this month: add templates and carry over unpaid one-offs
  const prevUnpaid = await prisma.bill.findMany({ where: { isPaid: false, templateId: null, NOT: { month: monthKey } } });
    const carryRows = prevUnpaid.map((b: Bill) => {
      const prevDue = new Date(b.dueDate);
      const day = clampDay(year, month, prevDue.getDate());
      const due = new Date(year, month - 1, day);
      return {
        name: b.name,
        categoryId: b.categoryId,
        templateId: b.templateId ?? undefined,
        amountDue: Number(b.amountDue),
        dueDate: due,
        isRecurring: b.isRecurring,
        isPaid: false,
        month: monthKey,
        bankAccount: (b as any).bankAccount ?? null,
        carriedOver: true,
        carriedOverFromId: b.id,
      };
    });

    // Insert template-generated bills; skip duplicates if any race happened
    if (templateRows.length) {
      await prisma.bill.createMany({ data: templateRows, skipDuplicates: true });
    }
    if (carryRows.length) {
      await prisma.bill.createMany({ data: carryRows, skipDuplicates: true });
    }
    return { ok: true, monthKey, created: true } as const;
  }

  // Month already exists: ensure any new templates are added for this month (idempotent)
  if (templateRows.length) {
    await prisma.bill.createMany({ data: templateRows, skipDuplicates: true });
  }

  // Also ensure any unpaid one-off bills from previous months are carried over into this month
  const prevUnpaid = await prisma.bill.findMany({ where: { isPaid: false, templateId: null, NOT: { month: monthKey } } });
  if (prevUnpaid.length) {
    const carryRows = prevUnpaid.map((b: Bill) => {
      const prevDue = new Date(b.dueDate);
      const day = clampDay(year, month, prevDue.getDate());
      const due = new Date(year, month - 1, day);
      return {
        name: b.name,
        categoryId: b.categoryId,
        templateId: b.templateId ?? undefined,
        amountDue: Number(b.amountDue),
        dueDate: due,
        isRecurring: b.isRecurring,
        isPaid: false,
        month: monthKey,
        bankAccount: (b as any).bankAccount ?? null,
        carriedOver: true,
        carriedOverFromId: b.id,
      };
    });
    await prisma.bill.createMany({ data: carryRows, skipDuplicates: true });
  }

  return { ok: true, monthKey, created: false } as const;
}
