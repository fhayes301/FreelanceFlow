"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createOneOffBillAction } from "@/server/actions";

export default function OneOffBillForm({ month, categories, onSuccess }: { month: string; categories: { id: string; name: string }[]; onSuccess?: () => void }) {
  const [state, formAction] = useFormState(createOneOffBillAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state?.ok, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="grid sm:grid-cols-6 gap-3">
      <input type="hidden" name="month" value={month} />
      <input name="name" className="border rounded px-3 py-2 sm:col-span-2" placeholder="Name" />
      <select name="categoryId" className="border rounded px-3 py-2">
        <option value="">Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="amountDue" type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Amount" />
      <input name="dueDate" type="date" className="border rounded px-3 py-2" />
      <input name="bankAccount" className="border rounded px-3 py-2" placeholder="Bank (optional)" />
      <button className="bg-black text-white px-4 py-2 rounded sm:col-span-6">Add bill</button>
      {state?.error && <p className="sm:col-span-5 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="sm:col-span-5 text-sm text-green-600">Bill added</p>}
    </form>
  );
}
