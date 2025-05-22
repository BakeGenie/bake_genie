import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';

export function AuthHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">BakeDiary</span>
          </Link>
        </div>
        <nav className="flex items-center gap-2">
          <ModeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}