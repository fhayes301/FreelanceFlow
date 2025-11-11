"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { createTemplateAction } from "@/server/actions";

export default function TemplateForm({ categories, onSuccess }: { categories: { id: string; name: string }[]; onSuccess?: () => void }) {
  const [state, formAction] = useFormState(createTemplateAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      onSuccess?.();
    }
  }, [state?.ok, onSuccess]);

  return (
    <form ref={formRef} action={formAction} className="grid sm:grid-cols-5 gap-3">
      <input name="name" className="border rounded px-3 py-2 sm:col-span-2" placeholder="Name (e.g., Rent)" />
      <select name="categoryId" className="border rounded px-3 py-2">
        <option value="">Category</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <input name="amountDefault" type="number" step="0.01" className="border rounded px-3 py-2" placeholder="Default amount" />
      <input name="dueDayDefault" type="number" min={1} max={31} className="border rounded px-3 py-2" placeholder="Due day" />
      <input name="bankAccountDefault" className="border rounded px-3 py-2" placeholder="Bank (optional)" />
      <button className="bg-black text-white px-4 py-2 rounded sm:col-span-5">Add template</button>
      {state?.error && <p className="sm:col-span-4 text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="sm:col-span-4 text-sm text-green-600">Template created</p>}
    </form>
  );
}
