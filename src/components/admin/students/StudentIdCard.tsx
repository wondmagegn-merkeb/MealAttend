
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
  // Use 000000-0 for a black QR code on a transparent background
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrDataToEncode)}&format=png&color=000000&bgcolor=ffffff&qzone=1`;


  return (
    <div className="w-[85.6mm] h-[54mm] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-[4mm] flex flex-col justify-between shadow-lg relative overflow-hidden font-sans">
      {/* Background pattern */}
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/10 via-background to-accent/5"
      ></div>
       <div 
        className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full"
      ></div>
       <div 
        className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full"
      ></div>


      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-[1mm] mb-[1mm] border-b border-primary/50 dark:border-primary/30 h-[12mm]">
          <div className="w-[10mm] h-[10mm] shrink-0">
            <Image 
                src="/addisspark-logo.jpg" 
                alt="School Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
                data-ai-hint="university logo"
             />
          </div>
          <div className="flex-1 text-center text-[10px] font-bold text-primary/80 dark:text-primary/90 -ml-[9mm] tracking-wider">{schoolName}</div>
          <div className="text-[8px] font-bold text-primary/80 dark:text-primary/90">{cardTitle}</div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 mt-[1mm] items-stretch gap-[3mm]">
          <div className="flex-1 flex flex-col justify-start h-full">
            <div className="flex items-center mb-[2mm]">
              <div className="w-[18mm] h-[18mm] shrink-0 mr-[1mm]">
                 <Image 
                    src={student.profileImageURL || `https://placehold.co/100x100.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
                    alt={`Photo of ${student.name}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-md border-2 border-white dark:border-slate-600 shadow-md"
                    data-ai-hint="student profile"
                 />
              </div>
              <div className="text-[9px] font-bold text-gray-800 dark:text-gray-100 break-words leading-tight">{student.name}</div>
            </div>
            <div className="text-[8px] text-gray-700 dark:text-gray-300 space-y-[0.5mm]">
              <div><strong>ID:</strong> {student.studentId}</div>
              <div><strong>Grade:</strong> {student.classGrade || 'N/A'}</div>
              <div><strong>Gender:</strong> {student.gender || 'N/A'}</div>
            </div>
          </div>

          <div className="h-full aspect-square rounded p-[1mm] flex items-center justify-center shrink-0">
             <Image
                src={qrCodeImageUrl}
                alt={`QR Code for ${student.name}`}
                width={100}
                height={100}
                className="w-full h-full object-contain rounded-md border-2 border-white dark:border-slate-600 shadow-md"
                data-ai-hint="QR code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

