import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QrCode, ShieldCheck, Salad } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <main className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center mb-6">
          <Salad className="h-20 w-20 text-primary" />
        </div>
        <h1 className="text-5xl font-bold text-primary">
          Welcome to MealAttend
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Streamline your meal attendance tracking with our intuitive QR code system and comprehensive admin dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
          <Button asChild size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/scan" className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Scan QR Code
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="shadow-md hover:shadow-lg transition-shadow">
            <Link href="/admin" className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Admin Dashboard
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground pt-8">
          Easy. Efficient. Organized.
        </p>
      </main>
    </div>
  );
}
