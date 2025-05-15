
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { QrCode, CheckCircle, AlertTriangle, Camera as CameraIcon, Loader2, Utensils } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { Student } from '@/types/student';
import type { AttendanceRecord } from '@/components/admin/AttendanceTable';
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY } from '@/lib/constants';
import { format } from 'date-fns';

type MealType = "Breakfast" | "Lunch" | "Dinner";

export function QrScannerClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("Lunch");
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null); // null initially, then true/false

  // Placeholder for playing sounds
  const playSound = (type: 'success' | 'error') => {
    console.log(`Playing ${type} sound (placeholder)`);
  };

  useEffect(() => {
    const getCameraPermission = async () => {
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

    getCameraPermission();

    return () => { // Cleanup function to stop the camera stream when component unmounts
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const processAttendance = async (studentInternalId: string, mealType: MealType) => {
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      const students: Student[] = storedStudentsRaw ? JSON.parse(storedStudentsRaw) : [];
      
      const student = students.find(s => s.id === studentInternalId);

      if (student) {
        const newAttendanceRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId: student.studentId,
          studentName: student.name,
          studentAvatar: student.profileImageURL,
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
          attendanceRecords.unshift(newAttendanceRecord);
          localStorage.setItem(ATTENDANCE_RECORDS_STORAGE_KEY, JSON.stringify(attendanceRecords));
          toast({
            title: "Attendance Recorded!",
            description: `${student.name} marked present for ${mealType}.`,
            variant: "default",
          });
          playSound('success');
        }
      } else {
        toast({
          title: "Student Not Found",
          description: `Student with scanned ID '${studentInternalId}' not found.`,
          variant: "destructive",
        });
        playSound('error');
      }
    } catch (error) {
      console.error("Error processing attendance:", error);
      toast({
        title: "Processing Error",
        description: "An error occurred while processing attendance.",
        variant: "destructive",
      });
      playSound('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateScanAndRecord = () => {
    if (!selectedMealType) {
      toast({ title: "Meal Type Required", description: "Please select a meal type.", variant: "destructive" });
      return;
    }
    // Use a valid student ID from your seed data for simulation
    const mockScannedInternalId = 'clxkxk001'; // Alice Johnson's internal ID
    processAttendance(mockScannedInternalId, selectedMealType);
  };

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <QrCode className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Scan Meal QR Code</CardTitle>
        <CardDescription>
          Select meal type. The camera feed will appear below if permission is granted.
          <br />
          <span className="text-xs text-muted-foreground">(QR code decoding from camera is not yet implemented - use simulation button)</span>
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
          className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden"
          aria-label="QR Code scanner preview"
        >
          {hasCameraPermission === null && ( // Initial state, waiting for permission
            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
              <Loader2 className="h-16 w-16 animate-spin mb-2" />
              <p>Requesting camera access...</p>
            </div>
          )}
          {/* Video element is always in the DOM to receive the stream */}
          <video ref={videoRef} className={`w-full h-full object-cover ${hasCameraPermission ? 'block' : 'hidden'}`} autoPlay playsInline muted />

          {hasCameraPermission === false && ( // Permission denied or error
            <div className="flex flex-col items-center text-destructive p-4 text-center">
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
                Camera access was denied or is unavailable. Please enable camera permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
        )}
        
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button 
          onClick={handleSimulateScanAndRecord} 
          disabled={isLoading || !hasCameraPermission || !selectedMealType} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Record Attendance (Simulate Scan)
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
            Point the camera at a student's QR code.
            For now, use the button above to simulate a scan.
        </p>
      </CardFooter>
    </Card>
  );
}

    