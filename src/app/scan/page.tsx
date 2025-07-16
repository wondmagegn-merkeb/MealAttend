
import { QrScannerClient } from "@/components/scan/QrScannerClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ScanPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="p-4 pb-0 sm:p-4 sm:pb-0">
            <Link href="/admin" passHref legacyBehavior>
                <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Button>
            </Link>
        </header>
        <main className="flex-1 flex justify-center items-center p-4 sm:p-6 pt-0">
            <QrScannerClient />
        </main>
      </div>
    </AuthGuard>
  );
}
