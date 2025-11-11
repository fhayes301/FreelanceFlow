"use client";

import { useState } from "react";
import Modal from "./Modal";
import TemplateForm from "./TemplateForm";

export default function NewTemplateModal({ categories }: { categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>New template</button>
      <Modal open={open} onClose={() => setOpen(false)} title="New template">
        <TemplateForm categories={categories} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
