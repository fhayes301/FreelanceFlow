import prisma from "@/lib/prisma";
import { upsertCategory, deleteCategory } from "@/server/actions";
import ColorDot from "@/components/ColorDot";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Categories</h1>

      <form
        action={async (fd: FormData) => {
          "use server";
          await upsertCategory(fd);
        }}
        className="p-4 border rounded flex flex-wrap gap-3 items-end"
      >
        <div className="flex-1">
          <label className="block text-sm text-gray-600">Name</label>
          <input name="name" className="w-full border rounded px-3 py-2" placeholder="e.g., Rent" />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Preset</label>
          <select name="presetColor" className="border rounded px-3 py-2 min-w-28">
            <option value="">None</option>
            <option value="#93C5FD">Sky</option>
            <option value="#A7F3D0">Mint</option>
            <option value="#86EFAC">Sage</option>
            <option value="#FDE68A">Sand</option>
            <option value="#C4B5FD">Lavender</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600">Custom</label>
          <input type="color" name="customColor" className="h-[38px] w-[56px] border rounded" />
        </div>
        <button className="bg-black text-white px-4 py-2 rounded">Add</button>
      </form>

      <ul className="divide-y border rounded">
  {categories.map((c: { id: string; name: string; color: string | null }) => (
          <li key={c.id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <ColorDot color={c.color} />
              <span>{c.name}</span>
            </div>
            <form action={async () => { "use server"; await deleteCategory(c.id); }}>
              <button className="text-red-600 hover:underline" type="submit">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
