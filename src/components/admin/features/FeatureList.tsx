
"use client";

import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { FeatureSortableItem } from './FeatureSortableItem';
import type { HomepageFeature } from '@prisma/client';

interface FeatureListProps {
    features: HomepageFeature[];
    onReorder: (reorderedFeatures: HomepageFeature[]) => void;
    onEdit: (feature: HomepageFeature) => void;
}

export function FeatureList({ features, onReorder, onEdit }: FeatureListProps) {
    const [items, setItems] = useState(features);

    React.useEffect(() => {
        setItems(features);
    }, [features]);

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
        return <p className="text-muted-foreground text-center py-8">No features yet. Add one to get started.</p>;
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                    {items.map(feature => (
                        <FeatureSortableItem key={feature.id} feature={feature} onEdit={onEdit} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
