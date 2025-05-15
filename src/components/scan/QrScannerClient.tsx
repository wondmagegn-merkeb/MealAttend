
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, CheckCircle, AlertTriangle, Camera as CameraIcon, Loader2, Utensils, ScanLine } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types/student';
import type { AttendanceRecord } from '@/components/admin/AttendanceTable';
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY } from '@/lib/constants';
import { format } from 'date-fns';

type MealType = "Breakfast" | "Lunch" | "Dinner";
const MOCK_SCANNED_INTERNAL_ID = 'clxkxk001'; // Alice Johnson's internal ID for simulation
const SCAN_COOLDOWN_MS = 5000; // Cooldown period of 5 seconds after a successful processing

export function QrScannerClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("Lunch");
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For potential QR library integration
  const animationFrameIdRef = useRef<number | null>(null);
  
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [lastProcessTime, setLastProcessTime] = useState<number>(0);

  const playSound = (type: 'success' | 'error') => {
    console.log(`Playing ${type} sound (placeholder)`);
    // Example for actual sound (uncomment and add sound files to /public/sounds/):
    // const audio = new Audio(`/sounds/${type}.mp3`);
    // audio.play().catch(e => console.error(`Error playing ${type} sound:`, e));
  };

  const processAttendance = useCallback(async (studentInternalId: string, mealType: MealType) => {
    if (isLoading) return; // Prevent multiple submissions if already processing
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      const students: Student[] = storedStudentsRaw ? JSON.parse(storedStudentsRaw) : [];
      
      const student = students.find(s => s.id === studentInternalId);

      if (student) {
        const newAttendanceRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId: student.studentId, // Store the display Student ID
          studentName: student.name,
          studentAvatar: student.profileImageURL,
          studentEmail: student.email, // Assuming student type has email
          date: format(new Date(), 'yyyy-MM-dd'),
          mealType: mealType,
          scannedAt: format(new Date(), 'hh:mm a'),
          status: 'Present',
        };

        const storedAttendanceRaw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
        let attendanceRecords: AttendanceRecord[] = storedAttendanceRaw ? JSON.parse(storedAttendanceRaw) : [];
        
        const existingRecord = attendanceRecords.find(
          r => r.studentId === newAttendanceRecord.studentId &&
               r.date === newAttendanceRecord.date &&
               r.mealType === newAttendanceRecord.mealType &&
               r.status === 'Present'
        );

        if (existingRecord) {
          toast({
            title: "Already Recorded",
            description: `${student.name} has already been marked present for ${mealType} today.`,
            variant: "default",
          });
          playSound('error');
        } else {
          attendanceRecords.unshift(newAttendanceRecord); // Add to the beginning
          localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify(attendanceRecords));
          toast({
            title: "Attendance Recorded!",
            description: `${student.name} marked present for ${mealType}.`,
            variant: "default", // Or a "success" variant if you have one
          });
          playSound('success');
        }
      } else {
        toast({
          title: "Student Not Found",
          description: `Student with scanned ID '${studentInternalId}' not found. Please ensure the QR code is valid.`,
          variant: "destructive",
        });
        playSound('error');
      }
    } catch (error) {
      console.error("Error processing attendance:", error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing attendance. Please try again.",
        variant: "destructive",
      });
      playSound('error');
    } finally {
      setIsLoading(false);
      setLastProcessTime(Date.now()); // Set cooldown after any processing attempt
    }
  }, [toast, isLoading]);


  const attemptAutoScan = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !hasCameraPermission || videoRef.current.paused || videoRef.current.ended) {
      if (hasCameraPermission) animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
      return;
    }

    const now = Date.now();
    if (now - lastProcessTime < SCAN_COOLDOWN_MS) {
      animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan); // Continue loop but don't process
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      // Match canvas size to video element size (not necessarily video stream size)
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      //
      // IMPORTANT: QR Code Decoding Placeholder
      //
      // This is where you would integrate a QR code decoding library (e.g., jsQR).
      // For example, with jsQR:
      //   const code = jsQR(imageData.data, imageData.width, imageData.height);
      //   if (code && code.data) {
      //     const scannedStudentId = code.data;
      //     console.log("QR Detected:", scannedStudentId);
      //     if (selectedMealType && !isLoading) { // Ensure meal type is selected and not already loading
      //       processAttendance(scannedStudentId, selectedMealType);
      //     }
      //   }
      //
      // For this demonstration, we will *simulate* a scan periodically.
      // Remove this simulation block when you integrate a real QR library.
      // This simulation will "scan" MOCK_SCANNED_INTERNAL_ID.
      // 
      if (selectedMealType && !isLoading) { // Ensure meal type is selected and not already loading
        console.log(`Simulating scan for ${MOCK_SCANNED_INTERNAL_ID} at ${new Date().toLocaleTimeString()}`);
        processAttendance(MOCK_SCANNED_INTERNAL_ID, selectedMealType);
      }
      // End of simulation block
    }
    
    animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
  }, [hasCameraPermission, lastProcessTime, selectedMealType, processAttendance, isLoading]);


  useEffect(() => {
    const getCameraPermissionAndStart = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Camera Not Supported',
          description: 'Your browser does not support camera access. Please try a different browser.',
        });
        setHasCameraPermission(false);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(err => console.error("Error playing video:", err)); // Autoplay
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

    return () => { // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [toast]);

  useEffect(() => {
    if (hasCameraPermission && videoRef.current) {
       // Start the scanning loop only if permission is granted and video element exists
      animationFrameIdRef.current = requestAnimationFrame(attemptAutoScan);
    } else if (animationFrameIdRef.current) {
      // Stop scanning loop if permission is lost or videoRef is not available
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [hasCameraPermission, attemptAutoScan]);


  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <ScanLine className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <CardTitle className="text-2xl">Scan Meal QR Code</CardTitle>
        <CardDescription>
          Select meal type. Auto-scanning will begin if camera is active.
          <br />
          <span className="text-xs text-muted-foreground">(Current auto-scan is simulated. Real QR decoding requires library integration.)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="mealType" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-muted-foreground" />Meal Type</Label>
          <Select 
            value={selectedMealType} 
            onValueChange={(value) => setSelectedMealType(value as MealType)}
            disabled={isLoading}
          >
            <SelectTrigger id="mealType">
              <SelectValue placeholder="Select meal type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Breakfast">Breakfast</SelectItem>
              <SelectItem value="Lunch">Lunch</SelectItem>
              <SelectItem value="Dinner">Dinner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div 
          className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden relative"
          aria-label="QR Code scanner preview"
        >
          {hasCameraPermission === null && (
            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
              <Loader2 className="h-16 w-16 animate-spin mb-2" />
              <p>Requesting camera access...</p>
            </div>
          )}
          
          <video 
            ref={videoRef} 
            className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`} 
            autoPlay 
            playsInline 
            muted 
          />
          {/* Hidden canvas for QR processing */}
          <canvas ref={canvasRef} style={{ display: 'none' }} />


          {hasCameraPermission === true && !videoRef.current?.srcObject && (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-black/50">
              <CameraIcon className="h-16 w-16 mb-2" />
              <p>Initializing camera...</p>
            </div>
          )}

          {hasCameraPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-destructive p-4 text-center bg-black/50">
              <AlertTriangle className="h-16 w-16 mb-2" />
              <p>Camera access denied or unavailable.</p>
              <p className="text-xs mt-1">Check browser settings.</p>
            </div>
          )}
        </div>

        {hasCameraPermission === false && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Camera Access Required</AlertTitle>
              <AlertDescription>
                Camera access was denied or is unavailable. Please enable camera permissions in your browser settings and refresh the page to use the scanner.
              </AlertDescription>
            </Alert>
        )}
        
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        {isLoading && (
          <div className="flex items-center text-primary">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
         <p className="text-xs text-muted-foreground text-center">
            {hasCameraPermission ? "Auto-scanning active. Point camera at QR code." : "Enable camera to start scanning."}
        </p>
        <p className="text-xs text-red-500 text-center font-semibold">
            Note: QR code detection is currently SIMULATED.
        </p>
      </CardFooter>
    </Card>
  );
}
