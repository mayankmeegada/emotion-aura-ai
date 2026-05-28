import { Link } from "@tanstack/react-router";

export function Nav() {
  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full glass px-5 py-3">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="inline-block size-2.5 rounded-full bg-[var(--neon)] shadow-[0_0_18px_var(--neon)]" />
          <span className="neon-text">EmoVision</span>
          <span className="text-foreground/70">AI</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-foreground/70 md:flex">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <Link to="/detect" className="hover:text-foreground">Live Detect</Link>
          <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
        </nav>
        <Link to="/detect" className="btn-hero !px-4 !py-2 text-sm">Launch demo →</Link>
      </div>
    </header>
  );
}
