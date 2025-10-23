import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Link, Group } from "@shared/schema";
import { Users } from "lucide-react";

interface ShareLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: Link | null;
}

export function ShareLinkDialog({ open, onOpenChange, link }: ShareLinkDialogProps) {
  const { toast } = useToast();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      if (!link) return;
      await apiRequest("POST", "/api/shares", {
        linkId: link.id,
        targetType: "group",
        groupIds,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link shared",
        description: "Your link has been shared with the selected groups.",
      });
      onOpenChange(false);
      setSelectedGroups([]);
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
        description: "Failed to share link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShare = () => {
    if (selectedGroups.length === 0) {
      toast({
        title: "No groups selected",
        description: "Please select at least one group to share with.",
        variant: "destructive",
      });
      return;
    }
    shareMutation.mutate(selectedGroups);
  };

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Link</DialogTitle>
          <DialogDescription>
            Select groups to share "{link?.title}" with
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          {groups.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                No groups available. Create a group first to share links.
              </p>
              <Button variant="outline" asChild>
                <a href="/groups">Create Group</a>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover-elevate"
                >
                  <Checkbox
                    id={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onCheckedChange={() => toggleGroup(group.id)}
                    data-testid={`checkbox-group-${group.id}`}
                  />
                  <label
                    htmlFor={group.id}
                    className="flex-1 cursor-pointer space-y-1"
                  >
                    <p className="font-medium">{group.name}</p>
                    {group.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {group.description}
                      </p>
                    )}
                  </label>
                  <Badge variant="secondary">{group.type}</Badge>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={shareMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={shareMutation.isPending || groups.length === 0}
            data-testid="button-share-confirm"
          >
            {shareMutation.isPending ? "Sharing..." : "Share Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
