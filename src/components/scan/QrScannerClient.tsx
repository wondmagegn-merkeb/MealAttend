
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QrCode, CheckCircle, AlertCircle, Camera, Loader2, Utensils } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import Image from 'next/image';
import type { Student } from '@/types/student';
import type { AttendanceRecord } from '@/components/admin/AttendanceTable';
import { STUDENTS_STORAGE_KEY, ATTENDANCE_RECORDS_STORAGE_KEY } from '@/lib/constants';
import { format } from 'date-fns';

type MealType = "Breakfast" | "Lunch" | "Dinner";

export function QrScannerClient() {
  const [scannedStudentId, setScannedStudentId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<MealType>("Lunch");
  const { toast } = useToast();

  // Placeholder for playing sounds
  const playSound = (type: 'success' | 'error') => {
    // In a real app, you'd have sound files in /public/sounds/
    // e.g., const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    // audio.play().catch(error => console.error("Error playing sound:", error));
    console.log(`Playing ${type} sound (placeholder)`);
  };

  const processAttendance = async (studentInternalId: string, mealType: MealType) => {
    setIsLoading(true);
    try {
      const storedStudentsRaw = localStorage.getItem(STUDENTS_STORAGE_KEY);
      const students: Student[] = storedStudentsRaw ? JSON.parse(storedStudentsRaw) : [];
      
      const student = students.find(s => s.id === studentInternalId);

      if (student) {
        const newAttendanceRecord: AttendanceRecord = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          studentId: student.studentId, // Display ID
          studentName: student.name,
          studentAvatar: student.profileImageURL,
          // studentEmail: student.email, // Student type doesn't have email
          date: format(new Date(), 'yyyy-MM-dd'),
          mealType: mealType,
          scannedAt: format(new Date(), 'hh:mm a'),
          status: 'Present',
        };

        const storedAttendanceRaw = localStorage.getItem(ATTENDANCE_RECORDS_STORAGE_KEY);
        let attendanceRecords: AttendanceRecord[] = storedAttendanceRaw ? JSON.parse(storedAttendanceRaw) : [];
        
        // Check for duplicate entry for the same student, meal, and date
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
          playSound('error'); // Or a specific 'already_recorded' sound
        } else {
          attendanceRecords.unshift(newAttendanceRecord); // Add to the beginning
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
      setScannedStudentId(null); // Clear after processing
      setIsScanning(false); // Reset scanning state
    }
  };

  const handleScanSimulation = () => {
    if (!selectedMealType) {
      toast({ title: "Meal Type Required", description: "Please select a meal type before scanning.", variant: "destructive" });
      return;
    }
    setIsScanning(true);
    setScannedStudentId(null); 
    
    // Simulate scanning time and receiving a student's internal ID
    setTimeout(() => {
      // Use a valid student ID from your seed data for simulation
      // e.g., the internal 'id' of Alice Johnson is 'clxkxk001'
      const mockScannedInternalId = 'clxkxk001'; 
      setScannedStudentId(mockScannedInternalId);
      // setIsScanning(false); // Keep scanning true until processing is complete or user cancels
      
      // Immediately process after simulated scan
      processAttendance(mockScannedInternalId, selectedMealType);

    }, 1500); 
  };


  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <QrCode className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-2xl">Scan Meal QR Code</CardTitle>
        <CardDescription>Select meal type, then scan the QR code to record attendance.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-2">
          <Label htmlFor="mealType" className="flex items-center gap-2"><Utensils className="h-4 w-4 text-muted-foreground" />Meal Type</Label>
          <Select 
            value={selectedMealType} 
            onValueChange={(value) => setSelectedMealType(value as MealType)}
            disabled={isScanning || isLoading}
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
          className="aspect-square w-full bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-primary/50 overflow-hidden"
          aria-label="QR Code scanner preview"
        >
          {isScanning && !isLoading ? ( // Show scanning animation only if not also loading (processing)
            <div className="flex flex-col items-center text-primary">
              <Loader2 className="h-16 w-16 animate-spin mb-2" />
              <p>Scanning & Processing...</p>
            </div>
          ) : isLoading ? ( // Show processing indicator
             <div className="flex flex-col items-center text-primary">
              <Loader2 className="h-16 w-16 animate-spin mb-2" />
              <p>Processing Attendance...</p>
            </div>
          ) : scannedStudentId ? ( // This state might be brief if processing is fast
             <div className="p-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-2" />
                <p className="font-semibold text-green-600">Scan Successful!</p>
                <p className="text-xs text-muted-foreground break-all">Student ID: {scannedStudentId}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
              <Camera className="h-16 w-16 mb-2" />
              <p>Camera preview will appear here.</p>
              <p className="text-xs mt-1">Click "Start Scan" to activate.</p>
            </div>
          )}
        </div>

        {/* Remove manual display of scanned data and submit button as it's now automatic */}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button onClick={handleScanSimulation} disabled={isScanning || isLoading} className="w-full">
          {isScanning || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isLoading ? 'Processing...' : 'Scanning...'}
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Start Scan & Record
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
