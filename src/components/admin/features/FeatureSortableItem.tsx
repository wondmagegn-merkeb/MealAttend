
"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as LucideIcons from 'lucide-react';
import { GripVertical, Edit, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { HomepageFeature } from '@prisma/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type IconName = keyof typeof LucideIcons;

interface FeatureSortableItemProps {
    feature: HomepageFeature;
    onEdit: (feature: HomepageFeature) => void;
}

const DynamicIcon = ({ name }: { name: string }) => {
  const IconComponent = LucideIcons[name as IconName] as React.ElementType;
  if (!IconComponent) return <Sparkles className="h-6 w-6 text-primary" />; // Fallback icon
  return <IconComponent className="h-6 w-6 text-primary" />;
};


export function FeatureSortableItem({ feature, onEdit }: FeatureSortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: feature.id });

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
                <div className="flex items-center justify-center h-10 w-10 bg-background rounded-md">
                   <DynamicIcon name={feature.icon} />
                </div>
                <div className="flex-grow">
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{feature.description}</p>
                </div>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                            {feature.isVisible ? <Eye className="h-5 w-5 text-green-600" /> : <EyeOff className="h-5 w-5 text-red-600" />}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{feature.isVisible ? 'Visible on homepage' : 'Hidden from homepage'}</p>
                    </TooltipContent>
                </Tooltip>
                
                <Button variant="outline" size="sm" onClick={() => onEdit(feature)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </Button>
            </div>
        </TooltipProvider>
    );
}
