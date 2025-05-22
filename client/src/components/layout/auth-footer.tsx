import { Link } from 'wouter';

export function AuthFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t py-6 md:py-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4 md:h-16">
        <div className="text-center md:text-left text-sm text-muted-foreground">
          <p>&copy; {currentYear} BakeDiary. All rights reserved.</p>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}