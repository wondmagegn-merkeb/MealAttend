
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logUserActivity } from '@/lib/activityLogger';
import { useAuth } from '@/hooks/useAuth';
import type { Student, AttendanceRecord } from "@prisma/client";

type MealType = "BREAKFAST" | "LUNCH" | "DINNER";
const SCAN_COOLDOWN_MS = 3000;

interface ScanPayload { qrCodeData: string; mealType: MealType; }
interface CheckPayload { studentId: string; mealType: MealType; }
interface ResultState {
    student: Student;
    record: AttendanceRecord | null;
    message: string;
    type: 'success' | 'info' | 'error' | 'already_recorded';
}

async function recordAttendance(payload: ScanPayload): Promise<any> {
    const response = await fetch('/api/attendance/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const responseData = await response.json();
    if (!response.ok && response.status !== 404) {
        throw new Error(responseData.message || `Error: ${response.status}`);
    }
    if (response.status === 404) {
      throw new Error(`Student with QR data not found.`);
    }
    return responseData;
}

async function checkAttendance(payload: CheckPayload): Promise<any> {
    const response = await fetch(`/api/attendance/status?studentId=${payload.studentId}&mealType=${payload.mealType}`);
    const responseData = await response.json();
    if (!response.ok) {
        throw new Error(responseData.message || `Error: ${response.status}`);
    }
    return responseData;
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
                    {result.record && (
                        <AlertDescription>
                            Scanned at: {format(parseISO(result.record.scannedAtTimestamp as unknown as string), 'hh:mm:ss a')}
                        </AlertDescription>
                    )}
                </Alert>
            </CardContent>
        </Card>
    );
}

export function QrScannerClient() {
  const { toast } = useToast();
  const { currentUserId } = useAuth();
  
  const [selectedMealType, setSelectedMealType] = useState<MealType>("LUNCH");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const [manualStudentId, setManualStudentId] = useState('');
  const [lastResult, setLastResult] = useState<ResultState | null>(null);

  const playSound = (type: 'success' | 'error' | 'alreadyRecorded') => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.play().catch(e => console.error(`Error playing sound '${type}':`, e));
    } catch (e) { console.error("Audio playback failed:", e); }
  };

  const scanMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: (data) => {
        const type = data.status === 'new_record' ? 'success' : 'already_recorded';
        playSound(type);
        setLastResult({ student: data.student, record: data.record, message: data.message, type });
        toast({ title: type === 'success' ? "Attendance Recorded!" : "Already Recorded", description: data.message });
        logUserActivity(currentUserId, "ATTENDANCE_RECORD_SUCCESS", `Student: ${data.student.name}, Meal: ${data.record.mealType}`);
    },
    onError: (error: Error) => {
        playSound('error');
        setLastResult({ student: null, record: null, message: error.message, type: 'error' });
        toast({ title: "Scan Error", description: error.message, variant: "destructive" });
        logUserActivity(currentUserId, "ATTENDANCE_RECORD_FAILURE", `Error: ${error.message}`);
    },
    onSettled: () => { setLastScanTime(Date.now()); },
  });
  
  const checkMutation = useMutation({
    mutationFn: checkAttendance,
    onSuccess: (data) => {
        if(data.attendanceRecord) {
            setLastResult({ student: data.student, record: data.attendanceRecord, message: `${data.student.name} has already been recorded for this meal today.`, type: 'already_recorded' });
        } else {
            setLastResult({ student: data.student, record: null, message: `${data.student.name} has not yet been recorded for this meal.`, type: 'info' });
        }
    },
    onError: (error: Error) => {
        setLastResult({ student: null, record: null, message: error.message, type: 'error' });
        toast({ title: "Search Error", description: error.message, variant: "destructive" });
    }
  });

  const processQrCode = useCallback((qrCodeData: string) => {
    if (scanMutation.isPending) return;
    scanMutation.mutate({ qrCodeData, mealType: selectedMealType });
  }, [scanMutation, selectedMealType]);

  const handleManualCheck = () => {
    if (!manualStudentId) {
        toast({ title: "Student ID Required", description: "Please enter a student ID to search." });
        return;
    }
    checkMutation.mutate({ studentId: manualStudentId, mealType: selectedMealType });
  }

  const attemptAutoScan = useCallback(() => {
    const isBusy = scanMutation.isPending || checkMutation.isPending;
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission || videoRef.current.paused || videoRef.current.ended || isBusy) {
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
  }, [hasCameraPermission, lastScanTime, processQrCode, scanMutation.isPending, checkMutation.isPending]);

  useEffect(() => {
    const getCameraPermissionAndStart = async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setHasCameraPermission(false); return; }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Error playing video:", err));
        }
      } catch (error) { setHasCameraPermission(false); }
    };
    getCameraPermissionAndStart();
    return () => {
      if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop()); }
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (hasCameraPermission && videoRef.current && !videoRef.current.paused) {
      animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
    }
    return () => { if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current); };
  }, [hasCameraPermission, attemptAutoScan]);

  const isProcessing = scanMutation.isPending || checkMutation.isPending;

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
            {hasCameraPermission === null && (<div className="flex flex-col items-center text-muted-foreground p-4 text-center"><Loader2 className="h-16 w-16 animate-spin mb-2" /><p>Requesting camera access...</p></div>)}
            <video ref={videoRef} className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`} autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            {hasCameraPermission === false && (<div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center bg-black/50"><AlertTriangle className="h-16 w-16 mb-2" /><p>Camera access denied or unavailable.</p><p className="text-xs mt-1">Check browser settings.</p></div>)}
          </div>
          {hasCameraPermission === false && (<Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Camera Access Required</AlertTitle><AlertDescription>Enable camera permissions in your browser settings to use the scanner.</AlertDescription></Alert>)}
          
          <CardDescription className='text-center'>OR</CardDescription>

          <div className="space-y-2">
             <Label htmlFor="manual-check" className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Manual Status Check</Label>
             <div className="flex gap-2">
                <Input id="manual-check" placeholder="Enter Student ID" value={manualStudentId} onChange={e => setManualStudentId(e.target.value)} disabled={isProcessing} />
                <Button onClick={handleManualCheck} disabled={isProcessing || !manualStudentId}>
                    {checkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                </Button>
             </div>
          </div>

        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {isProcessing && (<div className="flex items-center text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Processing... Please Wait</span></div>)}
          <p className="text-xs text-muted-foreground text-center">{hasCameraPermission ? "Auto-scanning active. Point camera at QR code." : "Enable camera for auto-scanning."}</p>
        </CardFooter>
      </Card>

      <div className="mt-6 w-full">
        <ScanResultDisplay result={lastResult} />
      </div>
    </div>
  );
}
