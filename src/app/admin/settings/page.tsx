
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid rendering UI that depends on theme until client is mounted
    // to prevent hydration mismatch.
    return null; 
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-primary">Settings</h2>
        <p className="text-muted-foreground">Manage application appearance.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
           <div className="p-4 rounded-lg border space-y-4">
              <Label htmlFor="dark-mode" className="text-base flex items-center">
                Theme
              </Label>
              <p className="text-sm text-muted-foreground">
                Select a theme for the application. System will use your device's default.
              </p>
               <RadioGroup
                defaultValue={theme}
                onValueChange={setTheme}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2"
                >
                <Label
                    htmlFor="light"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                    <RadioGroupItem value="light" id="light" className="sr-only" />
                    <Sun className="h-6 w-6" />
                    <span className="mt-2 block w-full text-center text-sm font-normal">Light</span>
                </Label>
                <Label
                    htmlFor="dark"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                    <RadioGroupItem value="dark" id="dark" className="sr-only" />
                    <Moon className="h-6 w-6" />
                     <span className="mt-2 block w-full text-center text-sm font-normal">Dark</span>
                </Label>
                 <Label
                    htmlFor="system"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                    <RadioGroupItem value="system" id="system" className="sr-only" />
                    <Laptop className="h-6 w-6" />
                     <span className="mt-2 block w-full text-center text-sm font-normal">System</span>
                </Label>
                </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
