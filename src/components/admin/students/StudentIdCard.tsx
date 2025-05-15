
"use client";

import type { Student } from "@/types/student";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { School } from "lucide-react"; // Using School icon as placeholder

interface StudentIdCardProps {
  student: Student;
}

export function StudentIdCard({ student }: StudentIdCardProps) {
  const schoolName = "Greenfield Secondary School"; // Placeholder school name
  const validUntil = "July 2026"; // Placeholder valid until

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground p-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10 border-2 border-primary-foreground">
            <AvatarImage src="https://placehold.co/40x40.png?text=S" alt="School Logo" data-ai-hint="school logo" />
            <AvatarFallback><School className="h-5 w-5" /></AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{schoolName}</h2>
        </div>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-3 gap-4 items-center">
        <div className="col-span-1 flex flex-col items-center space-y-3">
          <Avatar className="h-28 w-28 rounded-lg border-2 border-muted shadow-md">
            <AvatarImage 
              src={student.profileImageURL || `https://placehold.co/100x100.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`} 
              alt={student.name} 
              className="object-cover"
              data-ai-hint="student profile"
            />
            <AvatarFallback>{student.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
          </Avatar>
        </div>
        <div className="col-span-2 space-y-1.5">
          <p className="text-sm text-muted-foreground">Name</p>
          <h3 className="text-lg font-semibold text-primary truncate" title={student.name}>{student.name}</h3>
          
          <p className="text-sm text-muted-foreground pt-1">Gender</p>
          <p className="font-medium">{student.gender || 'N/A'}</p>
          
          <p className="text-sm text-muted-foreground pt-1">Class</p>
          <p className="font-medium">{student.class}</p>
          
          <p className="text-sm text-muted-foreground pt-1">ID No</p>
          <p className="font-medium">{student.studentId}</p>
        </div>
        <div className="col-span-3 pt-4 flex justify-center">
            <Image
                src="https://placehold.co/150x150.png"
                alt="QR Code Placeholder"
                width={150}
                height={150}
                data-ai-hint="QR code"
                className="rounded-md"
            />
        </div>
      </CardContent>
      <CardFooter className="bg-secondary/50 p-3">
        <p className="text-xs text-center w-full text-muted-foreground">Valid Until: {validUntil}</p>
      </CardFooter>
    </Card>
  );
}
