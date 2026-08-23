import { RetroTV } from "@/components/tv/RetroTV";

export default function Home() {
  return (
    <main className="page">
      <RetroTV />
      <p className="pageHint">
        ↑↓ channels · ←→ volume · space power
      </p>
    </main>
  );
}
