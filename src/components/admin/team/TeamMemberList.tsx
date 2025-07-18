
"use client";

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TeamMemberSortableItem } from './TeamMemberSortableItem';
import type { TeamMember } from '@prisma/client';

interface TeamMemberListProps {
    members: TeamMember[];
    onReorder: (reorderedMembers: TeamMember[]) => void;
    onEdit: (member: TeamMember) => void;
}

export function TeamMemberList({ members, onReorder, onEdit }: TeamMemberListProps) {
    const [items, setItems] = useState(members);

    React.useEffect(() => {
        setItems(members);
    }, [members]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id);
            const newIndex = items.findIndex((item) => item.id === over.id);
            
            const reorderedItems = arrayMove(items, oldIndex, newIndex);
            setItems(reorderedItems);
            onReorder(reorderedItems);
        }
    }

    if (!items || items.length === 0) {
        return <p className="text-muted-foreground text-center py-8">No team members yet. Add one to get started.</p>;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {items.map(member => (
                        <TeamMemberSortableItem key={member.id} member={member} onEdit={onEdit} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
