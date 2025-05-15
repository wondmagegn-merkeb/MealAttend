
"use client";

import type { Student } from "@/types/student";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from 'next/image';
import { School } from "lucide-react"; 

interface StudentIdCardProps {
  student: Student;
}

export function StudentIdCard({ student }: StudentIdCardProps) {
  const schoolName = "Greenfield Secondary School"; // Placeholder school name
  const validUntil = "July 2026"; // Placeholder valid until

  const qrDataToEncode = student.qrCodeData || student.id;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrDataToEncode)}&format=png&qzone=1`; // Increased size & qzone

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl rounded-xl overflow-hidden border-2 border-primary/20">
      <CardHeader className="bg-primary text-primary-foreground p-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9 border-2 border-primary-foreground bg-white">
            {/* Placeholder for school logo, you can replace src with an actual logo URL */}
            <AvatarImage src="https://placehold.co/40x40.png?text=GS" alt="School Logo" data-ai-hint="school logo" className="p-0.5" />
            <AvatarFallback><School className="h-5 w-5 text-primary" /></AvatarFallback>
          </Avatar>
          <h2 className="text-lg font-semibold">{schoolName}</h2>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
          {/* Left part: Image and Details */}
          <div className="flex-shrink-0 flex flex-col items-center sm:items-start w-full sm:w-auto">
            <Avatar className="h-32 w-32 sm:h-36 sm:w-36 rounded-lg border-2 border-muted shadow-md mb-4">
              <AvatarImage 
                src={student.profileImageURL || `https://placehold.co/150x150.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`} 
                alt={student.name} 
                className="object-cover"
                data-ai-hint="student profile"
              />
              <AvatarFallback className="text-4xl">{student.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div className="space-y-1.5 text-sm text-left w-full">
              <h3 className="text-xl font-semibold text-primary truncate" title={student.name}>{student.name}</h3>
              
              <div className="flex">
                <p className="w-16 font-medium text-muted-foreground">Gender:</p>
                <p className="font-medium">{student.gender || 'N/A'}</p>
              </div>
              
              <div className="flex">
                <p className="w-16 font-medium text-muted-foreground">Class:</p>
                <p className="font-medium">{student.class}</p>
              </div>
              
              <div className="flex">
                <p className="w-16 font-medium text-muted-foreground">ID No:</p>
                <p className="font-medium">{student.studentId}</p>
              </div>
            </div>
          </div>

          {/* Right part: QR Code */}
          <div className="flex-grow flex items-center justify-center sm:justify-end w-full sm:w-auto mt-4 sm:mt-0">
            <Image
                src={qrCodeImageUrl}
                alt={`QR Code for ${student.name}`}
                width={180} // Adjusted size
                height={180} // Adjusted size
                data-ai-hint="QR code"
                className="rounded-md border border-muted"
            />
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-secondary/30 p-2 border-t border-primary/20">
        <p className="text-xs text-center w-full text-muted-foreground font-medium">Valid Until: {validUntil}</p>
      </CardFooter>
    </Card>
  );
}

