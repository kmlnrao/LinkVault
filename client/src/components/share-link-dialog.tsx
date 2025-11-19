import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, User, X, Search, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ShareLinkDialogProps {
  linkId: string;
  linkTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareLinkDialog({ linkId, linkTitle, isOpen, onClose }: ShareLinkDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: isOpen,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users", searchQuery],
    queryFn: async () => {
      const res = await fetch(`/api/users?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to search users");
      return res.json();
    },
    enabled: isOpen,
  });

  const { data: currentShares = [], refetch: refetchShares } = useQuery({
    queryKey: ["/api/links", linkId, "shares"],
    enabled: isOpen,
  });

  const shareMutation = useMutation({
    mutationFn: async ({ targetType, targetIds }: { targetType: string; targetIds: string[] }) => {
      return await apiRequest("POST", `/api/links/${linkId}/share`, { targetType, targetIds });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Link shared successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/links", linkId, "shares"] });
      setSelectedGroups([]);
      setSelectedUsers([]);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to share link",
      });
    },
  });

  const unshareMutation = useMutation({
    mutationFn: async (shareId: string) => {
      return await apiRequest("DELETE", `/api/links/${linkId}/shares/${shareId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Link unshared successfully",
      });
      refetchShares();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to unshare link",
      });
    },
  });

  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleShare = () => {
    if (selectedGroups.length > 0) {
      shareMutation.mutate({ targetType: "group", targetIds: selectedGroups });
    }
    if (selectedUsers.length > 0) {
      shareMutation.mutate({ targetType: "user", targetIds: selectedUsers });
    }
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const groupShares = currentShares.filter((share: any) => share.targetType === "group");
  const userShares = currentShares.filter((share: any) => share.targetType === "contact");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="dialog-share-link">
        <DialogHeader>
          <DialogTitle>Share "{linkTitle}"</DialogTitle>
          <DialogDescription>
            Share this referral link with groups or individual users
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="groups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="groups" data-testid="tab-share-groups">
              <Users className="mr-2 h-4 w-4" />
              Groups
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-share-users">
              <User className="mr-2 h-4 w-4" />
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value="groups" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Select Groups</Label>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No groups available. Create a group first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group: any) => {
                      const isSelected = selectedGroups.includes(group.id);
                      const alreadyShared = groupShares.some((share: any) => share.targetId === group.id);

                      return (
                        <div
                          key={group.id}
                          onClick={() => !alreadyShared && toggleGroupSelection(group.id)}
                          className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                            isSelected ? "bg-primary/10 border-primary" : "hover-elevate"
                          } ${alreadyShared ? "opacity-50 cursor-not-allowed" : ""}`}
                          data-testid={`group-option-${group.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                            <div>
                              <p className="font-medium">{group.name}</p>
                              {group.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {group.description}
                                </p>
                              )}
                            </div>
                          </div>
                          {alreadyShared && <Badge variant="secondary">Already shared</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {groupShares.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Currently Shared With</Label>
                <div className="space-y-2">
                  {groupShares.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                      data-testid={`shared-group-${share.id}`}
                    >
                      <span className="text-sm">{share.target?.name || "Unknown Group"}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unshareMutation.mutate(share.id)}
                        disabled={unshareMutation.isPending}
                        data-testid={`button-unshare-${share.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <div>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchQuery ? "No users found" : "Start typing to search for users"}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user: any) => {
                      const isSelected = selectedUsers.includes(user.id);
                      const alreadyShared = userShares.some((share: any) => share.targetId === user.id);

                      return (
                        <div
                          key={user.id}
                          onClick={() => !alreadyShared && toggleUserSelection(user.id)}
                          className={`flex items-center justify-between p-3 rounded-md border cursor-pointer ${
                            isSelected ? "bg-primary/10 border-primary" : "hover-elevate"
                          } ${alreadyShared ? "opacity-50 cursor-not-allowed" : ""}`}
                          data-testid={`user-option-${user.id}`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profileImageUrl} />
                              <AvatarFallback>
                                {getInitials(user.firstName, user.lastName, user.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {user.firstName && user.lastName
                                  ? `${user.firstName} ${user.lastName}`
                                  : user.email}
                              </p>
                              {user.firstName && user.lastName && (
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              )}
                            </div>
                          </div>
                          {alreadyShared && <Badge variant="secondary">Already shared</Badge>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>

            {userShares.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Currently Shared With</Label>
                <div className="space-y-2">
                  {userShares.map((share: any) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                      data-testid={`shared-user-${share.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={share.target?.profileImageUrl} />
                          <AvatarFallback className="text-xs">
                            {getInitials(share.target?.firstName, share.target?.lastName, share.target?.email)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {share.target?.firstName && share.target?.lastName
                            ? `${share.target.firstName} ${share.target.lastName}`
                            : share.target?.email || "Unknown User"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => unshareMutation.mutate(share.id)}
                        disabled={unshareMutation.isPending}
                        data-testid={`button-unshare-user-${share.id}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-share">
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={selectedGroups.length === 0 && selectedUsers.length === 0 || shareMutation.isPending}
            data-testid="button-confirm-share"
          >
            {shareMutation.isPending ? "Sharing..." : "Share"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
