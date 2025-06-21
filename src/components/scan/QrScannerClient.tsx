
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Camera as CameraIcon, Loader2, Utensils, ScanLine } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import jsQR from 'jsqr';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
const SCAN_COOLDOWN_MS = 3000; // Cooldown period of 3 seconds

interface AttendancePayload {
    qrCodeData: string;
    mealType: MealType;
}

async function recordAttendance(payload: AttendancePayload): Promise<any> {
    const response = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.message || `Error: ${response.status}`);
    }
    return responseData;
}


export function QrScannerClient() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentUserId } = useAuth();
  
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  const playSound = (type: 'success' | 'error' | 'alreadyRecorded') => {
    try {
      const soundFile = `/sounds/${type}.mp3`;
      const audio = new Audio(soundFile);
      audio.play().catch(e => console.error(`Error playing sound '${type}':`, e));
    } catch (e) {
      console.error("Audio playback failed:", e);
    }
  };

  const attendanceMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: (data) => {
        playSound('success');
        toast({
            title: "Attendance Recorded!",
            description: `${data.studentName} marked present for ${data.mealType.toLowerCase()}.`,
            variant: "default",
        });
        queryClient.invalidateQueries({ queryKey: ['attendanceRecords'] });
        logUserActivity(currentUserId, "ATTENDANCE_RECORD_SUCCESS", `Student: ${data.studentName}, Meal: ${data.mealType}`);
    },
    onError: (error: Error) => {
        if (error.message.includes('already been recorded')) {
            playSound('alreadyRecorded');
            toast({ title: "Already Recorded", description: error.message, variant: "default" });
        } else {
            playSound('error');
            toast({ title: "Scan Error", description: error.message, variant: "destructive" });
        }
        logUserActivity(currentUserId, "ATTENDANCE_RECORD_FAILURE", `Error: ${error.message}`);
    },
    onSettled: () => {
        setLastScanTime(Date.now());
    },
  });

  const processQrCode = useCallback((qrCodeData: string) => {
    if (attendanceMutation.isPending) return;

    attendanceMutation.mutate({ qrCodeData, mealType: selectedMealType });

  }, [attendanceMutation, selectedMealType]);

  const attemptAutoScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission || videoRef.current.paused || videoRef.current.ended || attendanceMutation.isPending) {
      if (hasCameraPermission && videoRef.current && !videoRef.current.paused) { 
        animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
      }
      return;
    }

    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN_MS) {
      animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      if (canvas.width > 0 && canvas.height > 0) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          processQrCode(code.data);
        }
      }
    }
    animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
  }, [hasCameraPermission, lastScanTime, processQrCode, attendanceMutation.isPending]);

  useEffect(() => {
    const getCameraPermissionAndStart = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Error playing video:", err));
        }
      } catch (error) {
        setHasCameraPermission(false);
      }
    };
    getCameraPermissionAndStart();
    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (hasCameraPermission && videoRef.current && !videoRef.current.paused) {
      animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
    }
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [hasCameraPermission, attemptAutoScan]);

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4"><ScanLine className="h-12 w-12 text-primary animate-pulse" /></div>
        <CardTitle className="text-2xl">Scan Meal QR Code</CardTitle>
        <CardDescription>Select meal type. Auto-scanning will begin if camera is active.<br /><span className="text-xs text-muted-foreground">Ensure QR code is clear and well-lit.</span></CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="mealType" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-muted-foreground" />Meal Type</Label>
          <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)} disabled={attendanceMutation.isPending}>
            <SelectTrigger id="mealType"><SelectValue placeholder="Select meal type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="BREAKFAST">Breakfast</SelectItem>
              <SelectItem value="LUNCH">Lunch</SelectItem>
              <SelectItem value="DINNER">Dinner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden relative" aria-label="QR Code scanner preview">
          {hasCameraPermission === null && (<div className="flex flex-col items-center text-muted-foreground p-4 text-center"><Loader2 className="h-16 w-16 animate-spin mb-2" /><p>Requesting camera access...</p></div>)}
          <video ref={videoRef} className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`} autoPlay playsInline muted />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {hasCameraPermission === false && (<div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center bg-black/50"><AlertTriangle className="h-16 w-16 mb-2" /><p>Camera access denied or unavailable.</p><p className="text-xs mt-1">Check browser settings.</p></div>)}
        </div>
        {hasCameraPermission === false && (
            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Please enable camera permissions in your browser settings and refresh the page to use the scanner.</AlertDescription></Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {attendanceMutation.isPending && (<div className="flex items-center text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Processing...</span></div>)}
        <p className="text-xs text-muted-foreground text-center">{hasCameraPermission ? "Auto-scanning active. Point camera at QR code." : "Enable camera to start scanning."}</p>
      </CardFooter>
    </Card>
  );
}
