
"use client";

import Image from 'next/image';
import type { Student } from "@/types";
import { useAppSettings } from '@/hooks/useAppSettings';

interface StudentIdCardProps {
  student: Student;
  previewSettings?: {
    schoolName?: string;
    idCardTitle?: string;
    idCardLogoUrl?: string | null;
  }
}

export function StudentIdCard({ student, previewSettings }: StudentIdCardProps) {
  const { settings: globalSettings } = useAppSettings();

  const schoolName = previewSettings?.schoolName ?? globalSettings.schoolName;
  const cardTitle = previewSettings?.idCardTitle ?? globalSettings.idCardTitle ?? "STUDENT ID";
  const idCardLogo = previewSettings?.idCardLogoUrl ?? globalSettings.idCardLogoUrl;
  const idPrefix = globalSettings.idPrefix;
  
  const fullStudentId = student.studentId;

  const qrDataToEncode = student.qrCodeData || fullStudentId;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(qrDataToEncode)}&format=png&color=000000&bgcolor=ffffff&qzone=1`;


  return (
    <div className="w-[85.6mm] h-[54mm] bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg p-[4mm] flex items-center shadow-lg relative overflow-hidden font-sans">
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

      <div className="relative z-10 flex w-full items-center gap-[3mm]">
        {/* Left Section: Logos */}
        <div className="flex flex-col justify-between items-center h-full w-[22mm] shrink-0 space-y-2">
            <div className="w-[12mm] h-[12mm]">
                 <Image 
                    src={idCardLogo || "/addisspark-logo.jpg"} 
                    alt="School Logo"
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                    data-ai-hint="university logo"
                 />
            </div>
            <div className="text-[7px] text-center font-semibold text-primary/80 dark:text-primary/90 tracking-wide">{schoolName}</div>
        </div>
        
        {/* Center Section: Student Info */}
        <div className="flex-1 flex flex-col items-center text-center h-full">
            <Image 
              src={student.profileImageURL || `https://placehold.co/100x100.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
              alt={`Photo of ${student.name}`}
              width={100}
              height={100}
              className="w-[20mm] h-[20mm] object-cover rounded-md border-2 border-white dark:border-slate-600 shadow-md mb-1"
              data-ai-hint="student profile"
            />
             <div className="text-[10px] font-bold text-gray-800 dark:text-gray-100 break-words leading-tight">{student.name}</div>
             <div className="text-[8px] font-mono text-gray-600 dark:text-gray-300 tracking-tighter">{fullStudentId}</div>
              <div className="mt-1 text-[7px] text-gray-700 dark:text-gray-300 space-y-[0.2mm]">
                <div><strong>Grade:</strong> {student.classGrade || 'N/A'}</div>
                <div><strong>Gender:</strong> {student.gender || 'N/A'}</div>
             </div>
        </div>

        {/* Right Section: QR Code */}
        <div className="flex flex-col justify-between items-center h-full w-[22mm] shrink-0 space-y-1">
            <div className="text-[8px] font-bold text-primary/80 dark:text-primary/90 text-center">{cardTitle}</div>
            <div className="w-[18mm] h-[18mm] p-[1mm] flex items-center justify-center shrink-0">
             <Image
                src={qrCodeImageUrl}
                alt={`QR Code for ${student.name}`}
                width={100}
                height={100}
                className="w-full h-full object-contain rounded-sm border-2 border-white dark:border-slate-600 shadow-sm"
                data-ai-hint="QR code"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
