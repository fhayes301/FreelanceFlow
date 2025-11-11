"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { toMonthKey } from "@/lib/month";

export async function upsertCategory(form: FormData): Promise<void> {
  const id = form.get("id")?.toString();
  const name = form.get("name")?.toString() ?? "";
  const preset = form.get("presetColor")?.toString() || "";
  const custom = form.get("customColor")?.toString() || "";
  const color = (custom || preset || null) as string | null;
  if (!name.trim()) return;
  if (id) {
    await prisma.category.update({ where: { id }, data: { name, color: color ?? undefined } });
  } else {
    await prisma.category.create({ data: { name, color: color ?? undefined } });
  }
  revalidatePath("/categories");
}

export async function deleteCategory(id: string): Promise<void> {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categories");
}

export async function addOneOffBill(form: FormData): Promise<void> {
  const name = form.get("name")?.toString() ?? "";
  const categoryId = form.get("categoryId")?.toString() ?? "";
  const amountDue = parseFloat(form.get("amountDue")?.toString() ?? "0");
  const dueDate = new Date(form.get("dueDate")?.toString() ?? new Date());
  const month = form.get("month")?.toString() ?? toMonthKey(new Date());
  const bankAccount = form.get("bankAccount")?.toString() || null;
  if (!name || !categoryId) return;
  await prisma.bill.create({
    data: {
      name,
      categoryId,
      amountDue,
      dueDate,
      isRecurring: false,
      isPaid: false,
      month,
      bankAccount,
    },
  });
  revalidatePath(`/bills/${month}`);
  revalidatePath("/");
}

// Server action for useFormState: create a one-off bill with validation and stateful errors
export async function createOneOffBillAction(
  _prevState: { ok?: boolean; error?: string } | undefined,
  form: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const name = form.get("name")?.toString().trim() ?? "";
  const categoryId = form.get("categoryId")?.toString() ?? "";
  const amountRaw = form.get("amountDue")?.toString() ?? "";
  const dueRaw = form.get("dueDate")?.toString() ?? "";
  const month = form.get("month")?.toString() ?? toMonthKey(new Date());
  const bankAccount = form.get("bankAccount")?.toString() || null;

  if (!name) return { error: "Name is required" };
  if (!categoryId) return { error: "Please choose a category" };

  const amount = parseFloat(amountRaw);
  if (Number.isNaN(amount) || amount < 0) return { error: "Amount must be a non-negative number" };

  let dueDate: Date;
  try {
    dueDate = dueRaw ? new Date(dueRaw) : new Date();
    if (Number.isNaN(dueDate.getTime())) throw new Error("Invalid date");
  } catch {
    return { error: "Invalid due date" };
  }

  try {
    await prisma.bill.create({
      data: { name, categoryId, amountDue: amount, dueDate, isRecurring: false, isPaid: false, month, bankAccount },
    });
    revalidatePath(`/bills/${month}`);
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error creating bill";
    return { error: message };
  }
}

export async function addTemplate(form: FormData): Promise<void> {
  const name = form.get("name")?.toString() ?? "";
  const categoryId = form.get("categoryId")?.toString() ?? "";
  const amountDefault = parseFloat(form.get("amountDefault")?.toString() ?? "0");
  const dueDayDefault = parseInt(form.get("dueDayDefault")?.toString() ?? "1", 10);
  if (!name || !categoryId) return;
  await prisma.billTemplate.create({ data: { name, categoryId, amountDefault, dueDayDefault } });
}

// Server action for useFormState to create a template with validation and error messages
export async function createTemplateAction(
  _prevState: { ok?: boolean; error?: string } | undefined,
  form: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const name = form.get("name")?.toString().trim() ?? "";
  const categoryId = form.get("categoryId")?.toString() ?? "";
  const amountDefaultRaw = form.get("amountDefault")?.toString() ?? "";
  const dueDayDefaultRaw = form.get("dueDayDefault")?.toString() ?? "";
  const bankAccountDefault = form.get("bankAccountDefault")?.toString() || null;

  if (!name) return { error: "Name is required" };
  if (!categoryId) return { error: "Please choose a category" };

  const amountDefault = parseFloat(amountDefaultRaw);
  if (Number.isNaN(amountDefault) || amountDefault < 0) return { error: "Amount must be a non-negative number" };

  const dueDayDefault = parseInt(dueDayDefaultRaw, 10);
  if (Number.isNaN(dueDayDefault) || dueDayDefault < 1 || dueDayDefault > 31) {
    return { error: "Due day must be between 1 and 31" };
  }

  try {
    await prisma.billTemplate.create({ data: { name, categoryId, amountDefault, dueDayDefault, bankAccountDefault } });
    revalidatePath("/");
    return { ok: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error creating template";
    return { error: message };
  }
}

export async function togglePaid(id: string, month: string): Promise<void> {
  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill) return;
  await prisma.bill.update({ where: { id }, data: { isPaid: !bill.isPaid } });
  revalidatePath(`/bills/${month}`);
  revalidatePath("/");
}

export async function updateBillInline(
  id: string,
  month: string,
  data: { amountDue?: number; dueDate?: string; bankAccount?: string | null }
): Promise<void> {
  await prisma.bill.update({
    where: { id },
    data: {
      amountDue: data.amountDue ?? undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      bankAccount: data.bankAccount === undefined ? undefined : (data.bankAccount || null),
    },
  });
  revalidatePath(`/bills/${month}`);
  revalidatePath("/");
}

export async function deleteBill(id: string, month: string): Promise<void> {
  await prisma.bill.delete({ where: { id } });
  revalidatePath(`/bills/${month}`);
  revalidatePath("/");
}

export async function deleteTemplate(id: string, month?: string): Promise<void> {
  // Unlink existing bills from this template to avoid FK errors
  await prisma.$transaction([
    prisma.bill.updateMany({ where: { templateId: id }, data: { templateId: null } }),
    prisma.billTemplate.delete({ where: { id } }),
  ]);
  if (month) revalidatePath(`/bills/${month}`);
  revalidatePath("/");
}
