
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { TeamMember } from '@prisma/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TeamMemberSortableItemProps {
    member: TeamMember;
    onEdit: (member: TeamMember) => void;
}

export function TeamMemberSortableItem({ member, onEdit }: TeamMemberSortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: member.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TooltipProvider>
            <div ref={setNodeRef} style={style} {...attributes} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg shadow-sm border">
                <button {...listeners} className="cursor-grab p-1 text-muted-foreground hover:bg-muted rounded">
                    <GripVertical className="h-5 w-5" />
                </button>
                <Avatar>
                    <AvatarImage src={member.avatarUrl || `https://placehold.co/40x40.png?text=${member.name.split(' ').map(n=>n[0]).join('')}`} alt={member.name} data-ai-hint="professional" />
                    <AvatarFallback>{member.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                    <p className="font-semibold">{member.name} {member.isCeo && <Badge>CEO</Badge>}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                            {member.isVisible ? <Eye className="h-5 w-5 text-green-600" /> : <EyeOff className="h-5 w-5 text-red-600" />}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{member.isVisible ? 'Visible on homepage' : 'Hidden from homepage'}</p>
                    </TooltipContent>
                </Tooltip>
                
                <Button variant="outline" size="sm" onClick={() => onEdit(member)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>
        </TooltipProvider>
    );
}
