export function AdminFooter() {
  return (
    <footer className="border-t bg-background py-4 px-4 sm:px-6">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MealAttend. All rights reserved.
      </div>
    </footer>
  );
}
