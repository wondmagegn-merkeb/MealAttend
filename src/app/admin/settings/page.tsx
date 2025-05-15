import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-primary">Settings</h2>
        <p className="text-muted-foreground">Manage application settings and preferences.</p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure general application parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="appName">Application Name</Label>
            <Input id="appName" defaultValue="MealAttend" />
          </div>
          
          <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="notifications" className="text-base">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates for important events.
              </p>
            </div>
            <Switch id="notifications" aria-label="Toggle email notifications" />
          </div>

           <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">
                Toggle dark mode for the application interface. (Visual only, no functional toggle)
              </p>
            </div>
            <Switch id="dark-mode" defaultChecked aria-label="Toggle dark mode" />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Advanced Settings
          </CardTitle>
          <CardDescription>Be careful with these settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
            <Label htmlFor="apiEndpoint">API Endpoint</Label>
            <Input id="apiEndpoint" defaultValue="https://api.mealattend.com/v1" placeholder="e.g., https://api.example.com/v1" />
          </div>
          <Button variant="destructive" className="w-full sm:w-auto">
            Reset All Settings
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end pt-4">
        <Button size="lg">
          <Save className="mr-2 h-4 w-4" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
