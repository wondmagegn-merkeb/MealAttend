
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
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrDataToEncode)}&format=png&bgcolor=f1f5f9`;

  return (
    <div className="w-[85.6mm] h-[54mm] bg-gradient-to-br from-primary/10 via-background to-accent/10 dark:from-primary/20 dark:via-background dark:to-accent/20 border border-border rounded-xl p-[4mm] flex flex-col justify-between shadow-lg relative overflow-hidden font-sans text-card-foreground">
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-[1mm] mb-[2mm] border-b border-primary/50 h-[12mm]">
          <div className="w-[10mm] h-[10mm] shrink-0">
            <Image 
                src="https://placehold.co/40x40/1d4ed8/ffffff.png?text=TU" 
                alt="School Logo"
                width={40}
                height={40}
                className="rounded-full object-cover"
                data-ai-hint="university logo"
             />
          </div>
          <div className="flex-1 text-center">
            <p className="text-[9px] font-bold text-primary">{schoolName}</p>
            <p className="text-[7px] font-semibold text-muted-foreground">{cardTitle}</p>
          </div>
          <div className="w-[10mm] shrink-0"></div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 mt-[1mm] items-center gap-[4mm]">
          {/* Profile Picture */}
          <div className="w-[20mm] h-[26mm] shrink-0">
             <Image 
                src={student.profileImageURL || `https://placehold.co/100x130.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
                alt={`Photo of ${student.name}`}
                width={100}
                height={130}
                className="w-full h-full object-cover rounded-md border-2 border-primary/20"
                data-ai-hint="student profile"
             />
          </div>
          
          {/* Details & QR */}
          <div className="flex-1 flex flex-col justify-between h-full">
             <div className="text-[7.5px] text-foreground space-y-[1.5mm]">
              <div className="leading-tight">
                <p className="text-[9px] font-bold break-words">{student.name}</p>
              </div>
              <div className="leading-tight">
                <p className="text-[6.5px] text-muted-foreground">ID Number</p>
                <p>{student.studentId}</p>
              </div>
               <div className="leading-tight">
                <p className="text-[6.5px] text-muted-foreground">Grade</p>
                <p>{student.classGrade || 'N/A'}</p>
              </div>
            </div>

            <div className="w-[19mm] h-[19mm] aspect-square border border-border bg-slate-100 rounded-md p-[1mm] flex items-center justify-center shrink-0 self-end">
               <Image
                  src={qrCodeImageUrl}
                  alt={`QR Code for ${student.name}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-contain rounded-sm"
                  data-ai-hint="QR code"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
