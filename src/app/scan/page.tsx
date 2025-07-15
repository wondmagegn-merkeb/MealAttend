
import { QrScannerClient } from "@/components/scan/QrScannerClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ScanPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-primary/80 to-accent/80">
        <header className="p-4 sm:p-6">
            <Link href="/admin" passHref legacyBehavior>
                <Button variant="ghost" className="text-white hover:bg-white/20">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </Link>
        </header>
        <main className="flex-1 flex justify-center p-4 sm:p-8">
            <QrScannerClient />
        </main>
      </div>
    </AuthGuard>
  );
}
