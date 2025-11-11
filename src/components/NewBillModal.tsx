"use client";

import { useState } from "react";
import Modal from "./Modal";
import OneOffBillForm from "./OneOffBillForm";

export default function NewBillModal({ month, categories }: { month: string; categories: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="bg-black text-white px-4 py-2 rounded" onClick={() => setOpen(true)}>New bill</button>
      <Modal open={open} onClose={() => setOpen(false)} title="New bill (one-off)">
        <OneOffBillForm month={month} categories={categories} onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}
