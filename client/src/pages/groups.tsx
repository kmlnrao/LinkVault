import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Users,
  Link2,
  Copy,
  UserPlus,
} from "lucide-react";
import type { Group } from "@shared/schema";
import { GroupDialog } from "@/components/group-dialog";
import { InviteMembersDialog } from "@/components/invite-members-dialog";

type GroupWithCounts = Group & { memberCount: number; linkCount: number };

export default function GroupsPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithCounts | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: groups = [], isLoading } = useQuery<GroupWithCounts[]>({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group deleted",
        description: "The group has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredGroups = groups.filter(
    (group) =>
      !searchQuery ||
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (group: GroupWithCounts) => {
    setSelectedGroup(group);
    setIsGroupDialogOpen(true);
  };

  const handleInvite = (group: GroupWithCounts) => {
    setSelectedGroup(group);
    setIsInviteDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopyInviteCode = (inviteCode: string | null) => {
    if (!inviteCode) {
      toast({
        title: "No invite code",
        description: "This group doesn't have an invite code yet.",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Invite code copied",
      description: "Share this code with others to invite them to the group.",
    });
  };

  const getGroupInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-screen-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight mb-2">Groups</h1>
            <p className="text-muted-foreground">
              Create and manage private groups for sharing referral links.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedGroup(null);
              setIsGroupDialogOpen(true);
            }}
            data-testid="button-create-group"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Group
          </Button>
        </div>

        {/* Search */}
        <Card className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-groups"
            />
          </div>
        </Card>

        {/* Groups Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery ? "No groups found" : "No groups yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first group to start sharing links privately."}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => {
                    setSelectedGroup(null);
                    setIsGroupDialogOpen(true);
                  }}
                  data-testid="button-create-first-group"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Group
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <Card
                key={group.id}
                className="hover-elevate"
                data-testid={`group-card-${group.id}`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 bg-primary/10 text-primary">
                      <AvatarFallback>{getGroupInitials(group.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <Badge variant="secondary" className="mt-1">
                        {group.type}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-group-menu-${group.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(group)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleInvite(group)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Invite Members
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleCopyInviteCode(group.inviteCode)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Invite Code
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(group.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="space-y-4">
                  {group.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link2 className="h-4 w-4" />
                      <span>{group.linkCount} {group.linkCount === 1 ? 'link' : 'links'}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleInvite(group)}
                    data-testid={`button-invite-${group.id}`}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <GroupDialog
        open={isGroupDialogOpen}
        onOpenChange={setIsGroupDialogOpen}
        group={selectedGroup}
      />
      <InviteMembersDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        group={selectedGroup}
      />
    </div>
  );
}
