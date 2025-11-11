export default function ColorDot({ color }: { color: string | null }) {
  return <div className="w-4 h-4 rounded" style={{ background: color ?? "#e5e7eb" }} />;
}
