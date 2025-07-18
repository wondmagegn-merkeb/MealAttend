
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import { FeatureList } from "@/components/admin/features/FeatureList";
import { FeatureDialog } from "@/components/admin/features/FeatureDialog";
import Link from "next/link";
import type { HomepageFeature } from "@prisma/client";

const fetchFeatures = async (): Promise<HomepageFeature[]> => {
  const res = await fetch("/api/features");
  if (!res.ok) {
    throw new Error("Failed to fetch features");
  }
  return res.json();
};

export default function FeaturesSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<HomepageFeature | null>(null);
  const token = localStorage.getItem('mealAttendAuthToken_v1');

  const { data: features = [], isLoading, error } = useQuery<HomepageFeature[]>({
    queryKey: ["homepageFeatures"],
    queryFn: fetchFeatures,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedFeatures: HomepageFeature[]) => {
      const res = await fetch("/api/features/reorder", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderedIds: orderedFeatures.map((f) => f.id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to reorder features");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepageFeatures"] });
      toast({ title: "Success", description: "Feature order updated." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not reorder features: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (feature: HomepageFeature) => {
    setEditingFeature(feature);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingFeature(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setEditingFeature(null);
    setIsDialogOpen(false);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Error: {(error as Error).message}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-primary">Manage Features</h2>
            <p className="text-muted-foreground">Add, edit, and reorder features for the homepage.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" asChild>
                <Link href="/admin/super-settings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Link>
             </Button>
             <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Feature
             </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Homepage Feature List</CardTitle>
            <CardDescription>Drag and drop features to reorder them on the homepage. Only visible features are shown publicly.</CardDescription>
          </CardHeader>
          <CardContent>
            <FeatureList
              features={features}
              onReorder={(reordered) => reorderMutation.mutate(reordered)}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      </div>
      <FeatureDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        feature={editingFeature}
      />
    </>
  );
}
