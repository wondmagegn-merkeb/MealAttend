

"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, AlertTriangle, Info, Loader2, Utensils, ScanLine, Search, XCircle, UserPlus, Camera } from 'lucide-react';
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

const playWarningBeep = () => {
  try {
    if (typeof window !== 'undefined' && window.AudioContext) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.value = 0.1; 
      oscillator.frequency.value = 440; // Lower pitch for warning
      oscillator.type = 'sawtooth'; // Harsher sound for warning

      oscillator.start();
      
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 250); // Slightly longer duration
    }
  } catch (e) {
    console.error("Could not play warning beep sound:", e);
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

  const processScanOrCheck = useCallback(async (identifier: { qrCodeData?: string; studentId?: string }, isCheckOnly = false) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLastScanTime(Date.now());
    
    let response;
    try {
      const endpoint = isCheckOnly ? '/api/attendance/check' : '/api/scan';
      
      let body: any = { mealType: selectedMealType };
      if (identifier.qrCodeData) {
        body.qrCodeData = identifier.qrCodeData;
      } else if (identifier.studentId) {
        body.studentId = identifier.studentId;
      } else {
         throw new Error("No identifier provided.");
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'An unknown error occurred.');
      }

      if (result.success) {
          if (result.type === 'success') {
              playBeep();
              toast({ title: "Attendance Recorded!", description: `${result.student?.name} marked as present for ${selectedMealType}.` });
              logUserActivity(currentUserId, "ATTENDANCE_RECORD_SUCCESS", `Student: ${result.student?.name}, Meal: ${selectedMealType}`);
          } else if (result.type === 'already_recorded') {
               playWarningBeep();
               toast({ title: "Already Recorded", description: `${result.student?.name} has already been recorded.` });
          } else if (result.type === 'info') {
               playBeep();
               toast({ title: "Student Found", description: `${result.student?.name} has not yet been recorded for this meal.` });
          }
          setLastResult({ student: result.student || null, record: result.record || null, message: result.message, type: result.type });
      } else {
           throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
        const errorMessage = error.message || 'Failed to process request.';
        toast({ title: "Scan/Search Error", description: errorMessage, variant: "destructive" });
        logUserActivity(currentUserId, "ATTENDANCE_FAILURE", `Identifier: ${JSON.stringify(identifier)}. Error: ${errorMessage}`);
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
    // Perform a 'check' only, which won't create a record
    processScanOrCheck({ studentId: manualStudentId }, true);
  };
  
  const handleManualAdd = (studentInternalId: string) => {
    // Perform a 'scan' action, which creates a record
    processScanOrCheck({ studentId: studentInternalId }, false);
  };

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
        processScanOrCheck({ qrCodeData: code.data }, false);
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
    <div className="flex flex-col md:grid md:grid-cols-2 gap-8 items-start w-full max-w-6xl mx-auto">
        {/* Left Column: Scan Result Display */}
        <div className="w-full order-2 md:order-1">
            <ScanResultDisplay 
              result={lastResult}
              onClear={() => setLastResult(null)}
              onAdd={handleManualAdd}
              isProcessing={isProcessing}
            />
        </div>
        
        {/* Right Column: Scanner Controls */}
        <div className='w-full order-1 md:order-2'>
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

               <div className="space-y-2">
                <Label htmlFor="manual-check" className="flex items-center gap-2"><Search className="h-4 w-4 text-muted-foreground" />Manual Status Check</Label>
                <div className="flex gap-2">
                    <Input id="manual-check" placeholder="Enter Student ID" value={manualStudentId} onChange={e => setManualStudentId(e.target.value)} disabled={isProcessing} />
                    <Button onClick={handleManualCheck} disabled={isProcessing || !manualStudentId}>
                        {isProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                    </Button>
                </div>
              </div>

              <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden relative">
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                 <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-black/50 backdrop-blur-sm">
                    {hasCameraPermission === null && (
                      <div className="text-muted-foreground">
                          <Loader2 className="h-16 w-16 animate-spin mb-2 mx-auto" />
                          <p>Requesting camera access...</p>
                      </div>
                    )}
                    {hasCameraPermission === false && (
                      <div className="text-destructive space-y-4">
                          <AlertTriangle className="h-16 w-16 mx-auto" />
                          <div>
                            <p className="font-bold">Camera Access Required</p>
                            <p className="text-xs mt-1">Check browser settings to grant permission.</p>
                          </div>
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              {isProcessing && (<div className="flex items-center text-primary"><Loader2 className="mr-2 h-4 w-4 animate-spin" /><span>Processing... Please Wait</span></div>)}
              {hasCameraPermission && <p className="text-xs text-muted-foreground text-center">Auto-scanning active. Point camera at QR code.</p>}
            </CardFooter>
          </Card>
        </div>
    </div>
  );
}

interface ScanResultDisplayProps {
  result: ResultState | null;
  onClear: () => void;
  onAdd: (studentInternalId: string) => void;
  isProcessing: boolean;
}

function ScanResultDisplay({ result, onClear, onAdd, isProcessing }: ScanResultDisplayProps) {
    
    const getBorderColor = () => {
        if (!result) return 'border-muted/50';
        switch (result.type) {
            case 'success': return 'border-green-500';
            case 'already_recorded': return 'border-yellow-500';
            case 'info': return 'border-blue-500';
            case 'error': return 'border-destructive';
            default: return 'border-muted/50';
        }
    };
    
    const getIcon = () => {
       if (!result) return <Camera className="h-6 w-6 text-muted-foreground" />;
       switch (result.type) {
            case 'success': return <CheckCircle className="h-6 w-6 text-green-500" />;
            case 'already_recorded': return <Info className="h-6 w-6 text-yellow-500" />;
            case 'info': return <Info className="h-6 w-6 text-blue-500" />;
            case 'error': return <AlertTriangle className="h-6 w-6 text-destructive" />;
            default: return null;
       }
    }

    return (
        <Card className={`shadow-md transition-all border-2 w-full min-h-[500px] flex flex-col ${getBorderColor()}`}>
            <CardHeader className='pb-4'>
                <CardTitle className="flex items-center gap-3">{getIcon()} Scan Result</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center space-y-4">
                {result && result.student ? (
                    <>
                        <Avatar className="h-32 w-32 rounded-lg border-4 border-muted">
                           <AvatarImage src={result.student.profileImageURL || undefined} alt={result.student.name} data-ai-hint="student profile" className="object-cover" />
                           <AvatarFallback className="text-4xl">{result.student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="text-center">
                            <p className="font-bold text-2xl">{result.student.name}</p>
                            <p className="text-muted-foreground text-lg">ID: {result.student.studentId}</p>
                            <p className="text-muted-foreground">Grade: {result.student.classGrade || 'N/A'}</p>
                        </div>
                         <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className="bg-muted/50">
                            <AlertTitle>{result.message}</AlertTitle>
                            {result.record && result.record.scannedAtTimestamp && (
                                <AlertDescription>
                                    Scanned at: {format(parseISO(result.record.scannedAtTimestamp as unknown as string), 'hh:mm:ss a')}
                                </AlertDescription>
                            )}
                        </Alert>
                    </>
                ) : (
                    <div className="text-center text-muted-foreground">
                        <ScanLine className="h-24 w-24 mx-auto mb-4"/>
                        <p className="text-lg">Waiting for scan...</p>
                        <p>The result of the next scan or search will appear here.</p>
                    </div>
                )}
            </CardContent>
            {result && (
                 <CardFooter className="flex justify-end gap-2">
                    {result.type === 'info' && result.student && (
                      <>
                        <Button variant="outline" onClick={onClear} disabled={isProcessing}>
                            <XCircle className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button onClick={() => onAdd(result.student!.id)} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                            Add as Present
                        </Button>
                      </>
                    )}
                    {(result.type === 'success' || result.type === 'error' || result.type === 'already_recorded') && (
                       <Button variant="outline" onClick={onClear} disabled={isProcessing}>
                            <XCircle className="mr-2 h-4 w-4" /> Clear
                       </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
