export function AppFooter() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="h-10 bg-background border-t border-border flex items-center justify-center px-4 text-sm text-muted-foreground">
      <span>© {currentYear} Merkle Inc. All rights reserved.</span>
      <span className="mx-4">|</span>
      <a href="#" className="text-accent hover:underline">
        Responsible disclosure
      </a>
    </footer>
  );
}
