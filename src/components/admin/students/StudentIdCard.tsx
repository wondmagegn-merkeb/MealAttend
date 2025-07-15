
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
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrDataToEncode)}&format=png`;

  return (
    <div className="w-[85.6mm] h-[54mm] bg-white border border-gray-300 rounded-lg p-[4mm] flex flex-col justify-between shadow-lg relative overflow-hidden font-sans">
      {/* Background pattern */}
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 via-blue-50 to-white"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'
        }}
      ></div>
      <div
        className="absolute inset-0 w-full h-full bg-gradient-to-tl from-accent/10 via-transparent to-transparent"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 0 100%)'
        }}
      ></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-[1mm] mb-[1mm] border-b border-primary/50 h-[12mm]">
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
          <div className="flex-1 text-center text-[10px] font-bold text-primary/80 -ml-[9mm] tracking-wider">{schoolName}</div>
          <div className="text-[8px] font-bold text-primary/80">{cardTitle}</div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 mt-[1mm] items-stretch gap-[3mm]">
          <div className="flex-1 flex flex-col justify-start h-full">
            <div className="flex items-center mb-[2mm]">
              <div className="w-[18mm] h-[18mm] shrink-0 mr-[3mm]">
                 <Image 
                    src={student.profileImageURL || `https://placehold.co/100x100.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
                    alt={`Photo of ${student.name}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-md border-2 border-white shadow-md"
                    data-ai-hint="student profile"
                 />
              </div>
              <div className="text-[13px] font-bold text-gray-800 break-words leading-tight">{student.name}</div>
            </div>
            <div className="text-[10px] text-gray-700 space-y-[1.5mm]">
              <div><strong>ID:</strong> {student.studentId}</div>
              <div><strong>Grade:</strong> {student.classGrade || 'N/A'}</div>
              <div><strong>Gender:</strong> {student.gender || 'N/A'}</div>
            </div>
          </div>

          <div className="h-full aspect-square border border-slate-300 rounded p-[1mm] bg-white/80 flex items-center justify-center shrink-0">
             <Image
                src={qrCodeImageUrl}
                alt={`QR Code for ${student.name}`}
                width={100}
                height={100}
                className="w-full h-full object-contain"
                data-ai-hint="QR code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
