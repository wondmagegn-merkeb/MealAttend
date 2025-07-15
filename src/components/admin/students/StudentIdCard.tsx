"use client";

import Image from 'next/image';
import type { Student } from "@/types";

interface StudentIdCardProps {
  student: Student;
}

export function StudentIdCard({ student }: StudentIdCardProps) {
  const schoolName = "Tech University"; 
  const cardTitle = "STUDENT ID";

  const qrDataToEncode = student.qrCodeData || student.studentId;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrDataToEncode)}`;

  return (
    <div className="w-[85.6mm] h-[54mm] bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
        <div className="w-10 h-10">
            <Image 
                src="https://placehold.co/40x40.png" 
                alt="School Logo"
                width={40}
                height={40}
                className="rounded-full"
                data-ai-hint="university logo"
             />
        </div>
        <div className="text-center">
            <p className="font-bold text-primary">{schoolName}</p>
            <p className="text-xs text-muted-foreground">{cardTitle}</p>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center gap-4">
        {/* Profile Picture */}
        <div className="w-24 h-32">
             <Image 
                src={student.profileImageURL || `https://placehold.co/100x130.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
                alt={`Photo of ${student.name}`}
                width={100}
                height={130}
                className="w-full h-full object-cover rounded-md"
                data-ai-hint="student profile"
             />
        </div>
        
        {/* Details & QR */}
        <div className="flex-1 flex flex-col justify-between h-full">
            <div className="text-sm">
                <p className="font-bold text-lg">{student.name}</p>
                <p className="text-muted-foreground">ID: {student.studentId}</p>
                <p className="text-muted-foreground">Grade: {student.classGrade || 'N/A'}</p>
            </div>

            <div className="w-24 h-24 self-end">
               <Image
                  src={qrCodeImageUrl}
                  alt={`QR Code for ${student.name}`}
                  width={100}
                  height={100}
                  className="rounded-lg"
                  data-ai-hint="QR code"
              />
            </div>
        </div>
      </div>
    </div>
  );
}
