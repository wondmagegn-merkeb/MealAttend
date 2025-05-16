
import { QrScannerClient } from "@/components/scan/QrScannerClient";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function ScanPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-primary/80 to-accent/80 p-4 sm:p-8 relative">
          <Link href="/" passHref legacyBehavior>
              <Button variant="ghost" className="absolute top-4 left-4 text-white hover:bg-white/20">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
          </Link>
        <QrScannerClient />
      </div>
    </AuthGuard>
  );
}

    