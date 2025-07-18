
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";
import { TeamMemberList } from "@/components/admin/team/TeamMemberList";
import { TeamMemberDialog } from "@/components/admin/team/TeamMemberDialog";
import Link from "next/link";
import type { TeamMember } from "@prisma/client";

const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  const res = await fetch("/api/team");
  if (!res.ok) {
    throw new Error("Failed to fetch team members");
  }
  return res.json();
};

export default function TeamSettingsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const { data: teamMembers = [], isLoading, error } = useQuery<TeamMember[]>({
    queryKey: ["teamMembers"],
    queryFn: fetchTeamMembers,
  });

  const reorderMutation = useMutation({
    mutationFn: async (orderedMembers: TeamMember[]) => {
      const res = await fetch("/api/team/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderedIds: orderedMembers.map((m) => m.id),
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to reorder team members");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      toast({ title: "Success", description: "Team order updated." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Could not reorder team members: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingMember(null);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setEditingMember(null);
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
            <h2 className="text-3xl font-semibold tracking-tight text-primary">Manage Team</h2>
            <p className="text-muted-foreground">Add, edit, and reorder team members for the homepage.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" asChild>
                <Link href="/admin/super-settings"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Settings</Link>
             </Button>
             <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Member
             </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Team Member List</CardTitle>
            <CardDescription>Drag and drop members to reorder them on the homepage. Only visible members are shown publicly.</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMemberList
              members={teamMembers}
              onReorder={(reordered) => reorderMutation.mutate(reordered)}
              onEdit={handleEdit}
            />
          </CardContent>
        </Card>
      </div>
      <TeamMemberDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        member={editingMember}
      />
    </>
  );
}
