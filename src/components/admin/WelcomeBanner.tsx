
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useIsFirstVisit } from "@/hooks/useIsFirstVisit";
import { WELCOME_BANNER_DISMISSED_KEY } from "@/lib/constants";
import { PartyPopper, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function WelcomeBanner() {
  const [isFirstVisit, dismissWelcomeMessage, isMounted] = useIsFirstVisit(WELCOME_BANNER_DISMISSED_KEY);
  const { currentUser } = useAuth();

  if (!isMounted || !isFirstVisit) {
    return null;
  }

  return (
    <Alert className="mb-6 border-accent bg-accent/10 shadow-md relative">
      <PartyPopper className="h-5 w-5 text-accent absolute top-4 left-4" />
      <div className="pl-8">
        <AlertTitle className="text-lg font-semibold text-accent">Welcome, {currentUser?.fullName || 'Admin'}!</AlertTitle>
        <AlertDescription className="text-accent/80">
         This is your dashboard. Here you can get a quick overview of system activity and access key management areas.
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={dismissWelcomeMessage}
        className="absolute top-2 right-2 text-accent hover:bg-accent/20"
        aria-label="Dismiss welcome message"
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
}

    