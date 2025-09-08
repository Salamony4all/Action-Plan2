
import { Logo } from "@/components/icons";

export function Header() {
  return (
    <header className="p-4 border-b">
      <div className="container mx-auto flex items-center gap-3">
        <Logo className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight font-headline">NCSI Action Plan</h1>
      </div>
    </header>
  );
}
