
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
    <div className="w-[85.6mm] h-[54mm] bg-gradient-to-tr from-blue-50 to-blue-100 border border-blue-800 rounded-lg p-[4mm] flex flex-col justify-between shadow-lg relative overflow-hidden font-sans">
      <div className="absolute top-[-40%] left-[-40%] w-[200%] h-[200%] bg-radial-gradient-white-15 z-0 transform rotate-45"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between pb-[1mm] mb-[1mm] border-b border-blue-900 h-[12mm]">
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
          <div className="flex-1 text-center text-xs font-bold text-blue-800 -ml-[9mm]">{schoolName}</div>
          <div className="text-[7px] font-bold text-blue-800">{cardTitle}</div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 mt-[1mm] items-center gap-[3mm]">
          <div className="flex-1 flex flex-col justify-start h-full">
            <div className="flex items-center mb-[2mm]">
              <div className="w-[16mm] h-[16mm] shrink-0 mr-[3mm]">
                 <Image 
                    src={student.profileImageURL || `https://placehold.co/100x100.png?text=${student.name.split(' ').map(n=>n[0]).join('')}`}
                    alt={`Photo of ${student.name}`}
                    width={100}
                    height={100}
                    className="w-full h-full object-cover rounded-md border border-gray-400"
                    data-ai-hint="student profile"
                 />
              </div>
              <div className="text-[9px] font-bold text-slate-800 break-words">{student.name}</div>
            </div>
            <div className="text-[7.5px] text-slate-700 space-y-[1mm]">
              <div><strong>ID:</strong> {student.studentId}</div>
              <div><strong>Grade:</strong> {student.classGrade || 'N/A'}</div>
              <div><strong>Gender:</strong> {student.gender || 'N/A'}</div>
            </div>
          </div>

          <div className="h-[21mm] w-[21mm] aspect-square border border-slate-300 rounded p-[1mm] bg-white flex items-center justify-center shrink-0">
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
       <style jsx>{`
        .bg-radial-gradient-white-15 {
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
        }
      `}</style>
    </div>
  );
}
