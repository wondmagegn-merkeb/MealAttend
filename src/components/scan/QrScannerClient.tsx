"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { QrCode, CheckCircle, AlertCircle, Camera, Loader2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';

export function QrScannerClient() {
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock scanning process
  const handleScan = () => {
    setIsScanning(true);
    setScannedData(null); // Clear previous scan
    setTimeout(() => {
      const mockData = `USER_ID_${Date.now()}_MEAL_LUNCH`;
      setScannedData(mockData);
      setIsScanning(false);
      toast({
        title: "QR Code Scanned!",
        description: `Data: ${mockData}`,
        variant: "default",
      });
    }, 2000); // Simulate scanning time
  };

  // Mock submission
  const handleSubmit = async () => {
    if (!scannedData) {
      toast({
        title: "No Data",
        description: "Please scan a QR code first.",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast({
      title: "Attendance Submitted!",
      description: `Record for ${scannedData} processed.`,
      variant: "default",
      action: (
        <Button variant="outline" size="sm" onClick={() => console.log("Undo action")}>
          Undo
        </Button>
      ),
    });
    setScannedData(null); // Clear after submission
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <QrCode className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Scan Meal QR Code</CardTitle>
        <CardDescription>Position the QR code within the frame to record attendance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div 
          className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden"
          aria-label="QR Code scanner preview"
        >
          {isScanning ? (
            <div className="flex flex-col items-center text-primary">
              <Loader2 className="h-16 w-16 animate-spin mb-2" />
              <p>Scanning...</p>
            </div>
          ) : scannedData ? (
             <div className="p-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-600">Scan Successful!</p>
                <p className="text-xs text-muted-foreground break-all">Data: {scannedData}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
              <Camera className="h-16 w-16 mb-2" />
              <p>Camera preview will appear here.</p>
              <p className="text-xs mt-1">Click "Start Scan" to activate.</p>
            </div>
          )}
        </div>

        {!isScanning && scannedData && (
          <div className="p-3 bg-green-500/10 rounded-md border border-green-500/30">
            <Label htmlFor="scannedData" className="text-green-700">Scanned Data:</Label>
            <Input id="scannedData" type="text" value={scannedData} readOnly className="mt-1 bg-white" />
          </div>
        )}

        {isScanning && (
            <div className="p-3 bg-blue-500/10 rounded-md border border-blue-500/30 text-center">
                <p className="text-sm text-primary"> Ensure good lighting and a clear QR code.</p>
            </div>
        )}

      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={handleScan} disabled={isScanning} className="w-full">
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Scan
            </>
          )}
        </Button>
        <Button onClick={handleSubmit} disabled={!scannedData || isLoading || isScanning} variant="outline" className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Attendance"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
