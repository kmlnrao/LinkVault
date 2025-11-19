import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Users,
  Link2,
  UserPlus,
  Crown,
  ExternalLink,
  Trash2,
} from "lucide-react";
import type { Group, User, Link } from "@shared/schema";
import { InviteMembersDialog } from "@/components/invite-members-dialog";
import { useState, useEffect } from "react";

type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: Date | null;
  user: User;
};

type GroupWithCounts = Group & { memberCount: number; linkCount: number };

export default function GroupDetailPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

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

  const { data: group, isLoading: groupLoading } = useQuery<GroupWithCounts>({
    queryKey: ["/api/groups", id],
    enabled: isAuthenticated && !!id,
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<GroupMember[]>({
    queryKey: ["/api/groups", id, "members"],
    enabled: isAuthenticated && !!id,
  });

  const { data: sharedLinks = [], isLoading: linksLoading } = useQuery<Link[]>({
    queryKey: ["/api/groups", id, "links"],
    enabled: isAuthenticated && !!id,
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/groups/${id}/members/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Member removed",
        description: "The member has been removed from the group.",
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
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRemoveMember = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName} from this group?`)) {
      removeMemberMutation.mutate(userId);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  if (authLoading || groupLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto p-6 md:p-8">
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Group not found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The group you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate("/groups")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Groups
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-screen-2xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/groups")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-semibold tracking-tight">{group.name}</h1>
              <Badge variant="secondary">{group.type}</Badge>
            </div>
            {group.description && (
              <p className="text-muted-foreground mt-2">{group.description}</p>
            )}
          </div>
          <Button onClick={() => setIsInviteDialogOpen(true)} data-testid="button-invite-members">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Members
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.memberCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Links</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{group.linkCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="links">Shared Links</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            {membersLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No members yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Invite members to start sharing links privately.
                  </p>
                  <Button onClick={() => setIsInviteDialogOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Members
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <Card key={member.id} data-testid={`member-card-${member.userId}`}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>
                            {getInitials(member.user.firstName || "", member.user.lastName || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {member.user.firstName} {member.user.lastName}
                            </p>
                            {member.role === "owner" && (
                              <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {member.role}
                        </Badge>
                        {member.role !== "owner" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveMember(
                                member.userId,
                                `${member.user.firstName} ${member.user.lastName}`
                              )
                            }
                            data-testid={`button-remove-${member.userId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="links" className="space-y-4">
            {linksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : sharedLinks.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Link2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No links shared yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Share referral links with this group to start collaborating.
                  </p>
                  <Button onClick={() => navigate("/links")}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Go to Links
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {sharedLinks.map((link) => (
                  <Card key={link.id} className="hover-elevate" data-testid={`link-card-${link.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{link.title}</h3>
                            <Badge variant="outline">{link.category}</Badge>
                          </div>
                          {link.institution && (
                            <p className="text-sm text-muted-foreground mb-2">{link.institution}</p>
                          )}
                          {link.bonusValue && (
                            <div className="flex items-center gap-2 text-sm font-medium text-primary mb-2">
                              <span>{link.bonusValue}</span>
                            </div>
                          )}
                          {link.notesEncrypted && (
                            <p className="text-sm text-muted-foreground">{link.notesEncrypted}</p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/links`)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <InviteMembersDialog
        open={isInviteDialogOpen}
        onOpenChange={setIsInviteDialogOpen}
        group={group}
      />
    </div>
  );
}
