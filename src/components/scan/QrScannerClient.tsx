
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, AlertTriangle, Info, Loader2, Utensils, ScanLine, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import jsQR from 'jsqr';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { Student, AttendanceRecord, MealType } from "@/types";

const SCAN_COOLDOWN_MS = 3000;

interface ResultState {
    student: Student | null;
    record: AttendanceRecord | null;
    message: string;
    type: 'success' | 'info' | 'error' | 'already_recorded';
}

const playBeep = () => {
  try {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.value = 0.1; 
      oscillator.frequency.value = 880; 
      oscillator.type = 'sine';

      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 150);
    }
  } catch (e) {
    console.error("Could not play beep sound:", e);
  }
};


export function QrScannerClient() {
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [manualStudentId, setManualStudentId] = useState('');
  const [lastResult, setLastResult] = useState<ResultState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processScanOrCheck = useCallback(async (identifier: { qrCodeData?: string; studentId?: string }) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLastScanTime(Date.now());
    
    let response;
    try {
      if (identifier.qrCodeData) {
        response = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qrCodeData: identifier.qrCodeData, mealType: selectedMealType }),
        });
      } else if (identifier.studentId) {
        response = await fetch('/api/attendance/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: identifier.studentId, mealType: selectedMealType }),
        });
      } else {
        throw new Error("No identifier provided.");
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'An unknown error occurred.');
      }

      if (result.success) {
          playBeep(); // Play beep on any successful interaction
          if (result.type === 'success') {
              toast({ title: "Attendance Recorded!", description: `${result.student?.name} marked as present for ${selectedMealType}.` });
              logUserActivity(currentUserId, "ATTENDANCE_RECORD_SUCCESS", `Student: ${result.student?.name}, Meal: ${selectedMealType}`);
          } else if (result.type === 'already_recorded') {
               toast({ title: "Already Recorded", description: `${result.student?.name} has already been recorded.` });
          } else if (result.type === 'info') {
               toast({ title: "Student Found", description: `${result.student?.name} has not yet been recorded for this meal.` });
          }
          setLastResult({ student: result.student || null, record: result.record || null, message: result.message, type: result.type });
      } else {
           throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
        const errorMessage = error.message || 'Failed to process request.';
        toast({ title: "Scan/Search Error", description: errorMessage, variant: "destructive" });
        logUserActivity(currentUserId, "ATTENDANCE_FAILURE", `Identifier: ${identifier.qrCodeData || identifier.studentId}. Error: ${errorMessage}`);
        setLastResult({ student: null, record: null, message: errorMessage, type: 'error' });
    } finally {
        setIsProcessing(false);
    }
  }, [selectedMealType, toast, currentUserId, isProcessing]);


  const handleManualCheck = () => {
    if (!manualStudentId) {
        toast({ title: "Student ID Required", description: "Please enter a student ID to search." });
        return;
    }
    processScanOrCheck({ studentId: manualStudentId });
  }

  const attemptAutoScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.paused || videoRef.current.ended) {
      return;
    }

    const now = Date.now();
    if (now - lastScanTime < SCAN_COOLDOWN_MS) {
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    
    if (context && video.videoWidth > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      if (code && code.data) {
        processScanOrCheck({ qrCodeData: code.data });
      }
    }
  }, [lastScanTime, processScanOrCheck]);

  useEffect(() => {
    let animationFrameId: number | null = null;
    
    const scanLoop = () => {
        attemptAutoScan();
        animationFrameId = requestAnimationFrame(scanLoop);
    };

    const getCameraPermissionAndStart = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access. Please use a different browser.',
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
                setHasCameraPermission(true);
                animationFrameId = requestAnimationFrame(scanLoop);
            }).catch(playErr => {
                console.error("Video play error:", playErr);
                setHasCameraPermission(false);
            });
          };
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use the scanner.',
        });
      }
    };
    
    getCameraPermissionAndStart();
    
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
      }
    };
  }, [toast, attemptAutoScan]);

  return (
    <div className='w-full max-w-md'>
      <Card className="w-full shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4"><ScanLine className="h-12 w-12 text-primary" /></div>
          <CardTitle className="text-2xl">Scan & Check Attendance</CardTitle>
          <CardDescription>Scan a QR code or manually check a student's attendance status.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mealType" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-muted-foreground" />Meal Type</Label>
            <Select value={selectedMealType} onValueChange={(value) => setSelectedMealType(value as MealType)} disabled={isProcessing}>
              <SelectTrigger id="mealType"><SelectValue placeholder="Select meal type" /></SelectTrigger>
              <SelectContent><SelectItem value="BREAKFAST">Breakfast</SelectItem><SelectItem value="LUNCH">Lunch</SelectItem><SelectItem value="DINNER">Dinner</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden relative">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {hasCameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-black/50">
                <Loader2 className="h-16 w-16 animate-spin mb-2" />
                <p>Requesting camera access...</p>
              </div>
            )}
             {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center bg-black/50">
                <AlertTriangle className="h-16 w-16 mb-2" />
                <p className="font-bold">Camera Access Required</p>
                <p className="text-xs mt-1">Check browser settings to grant permission.</p>
              </div>
            )}
          </div>
          
          <CardDescription className='text-center'>OR</CardDescription>

          <div className="space-y-2">
             <Label htmlFor="manual-check" className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Manual Status Check</Label>
             <div className="flex gap-2">
                <Input id="manual-check" placeholder="Enter Student ID" value={manualStudentId} onChange={e => setManualStudentId(e.target.value)} disabled={isProcessing} />
                <Button onClick={handleManualCheck} disabled={isProcessing || !manualStudentId}>
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                </Button>
             </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isProcessing && (<div className="flex items-center text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Processing... Please Wait</span></div>)}
          <p className="text-xs text-muted-foreground text-center">{hasCameraPermission ? "Auto-scanning active. Point camera at QR code." : "Waiting for camera..."}</p>
        </CardFooter>
      </Card>

      <div className="mt-6 w-full">
        <ScanResultDisplay result={lastResult} />
      </div>
    </div>
  );
}

function ScanResultDisplay({ result }: { result: ResultState | null }) {
    if (!result) return null;

    const getBorderColor = () => {
        switch (result.type) {
            case 'success': return 'border-green-500';
            case 'already_recorded': return 'border-amber-500';
            case 'info': return 'border-blue-500';
            case 'error': return 'border-destructive';
            default: return 'border-muted';
        }
    };
    
    const getIcon = () => {
       switch (result.type) {
            case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'already_recorded': return <Info className="h-6 w-6 text-amber-500" />;
            case 'info': return <Info className="h-6 w-6 text-blue-500" />;
            case 'error': return <AlertTriangle className="h-6 w-6 text-destructive" />;
            default: return null;
       }
    }

    return (
        <Card className={`shadow-md transition-all border-2 ${getBorderColor()}`}>
            <CardHeader className='pb-4'>
                <CardTitle className="flex items-center gap-3">{getIcon()} Last Action Result</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {result.student ? (
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 rounded-md">
                           <AvatarImage src={result.student.profileImageURL || undefined} alt={result.student.name} data-ai-hint="student profile" />
                           <AvatarFallback>{result.student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">
                            <p className="font-bold text-base">{result.student.name}</p>
                            <p className="text-muted-foreground">ID: {result.student.studentId}</p>
                            <p className="text-muted-foreground">Grade: {result.student.classGrade || 'N/A'}</p>
                        </div>
                    </div>
                ) : null}
                <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className="bg-muted/50">
                    <AlertTitle>{result.message}</AlertTitle>
                    {result.record && result.record.scannedAtTimestamp && (
                        <AlertDescription>
                            Scanned at: {format(parseISO(result.record.scannedAtTimestamp as unknown as string), 'hh:mm:ss a')}
                        </AlertDescription>
                    )}
                </Alert>
            </CardContent>
        </Card>
    );
}
