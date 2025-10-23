import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Mail } from "lucide-react";
import type { Group } from "@shared/schema";

interface InviteMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
}

export function InviteMembersDialog({
  open,
  onOpenChange,
  group,
}: InviteMembersDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  const inviteMutation = useMutation({
    mutationFn: async (emailList: string[]) => {
      if (!group) return;
      await apiRequest("POST", `/api/groups/${group.id}/invite`, {
        emails: emailList,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Invitations sent",
        description: "Members have been invited to join the group.",
      });
      onOpenChange(false);
      setEmails([]);
      setEmail("");
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
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAddEmail = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast({
        title: "Duplicate email",
        description: "This email has already been added.",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setEmail("");
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter((e) => e !== emailToRemove));
  };

  const handleInvite = () => {
    if (emails.length === 0) {
      toast({
        title: "No emails",
        description: "Please add at least one email address.",
        variant: "destructive",
      });
      return;
    }
    inviteMutation.mutate(emails);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Invite people to join "{group?.name}" via email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                data-testid="input-invite-email"
              />
              <Button onClick={handleAddEmail} data-testid="button-add-email">
                Add
              </Button>
            </div>
          </div>

          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Invited Emails ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-md min-h-12">
                {emails.map((emailItem) => (
                  <Badge
                    key={emailItem}
                    variant="secondary"
                    className="pl-2 pr-1 py-1"
                    data-testid={`badge-email-${emailItem}`}
                  >
                    <Mail className="h-3 w-3 mr-1" />
                    <span className="text-xs">{emailItem}</span>
                    <button
                      onClick={() => handleRemoveEmail(emailItem)}
                      className="ml-1 hover:bg-background rounded-sm p-0.5"
                      data-testid={`button-remove-email-${emailItem}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={inviteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            disabled={inviteMutation.isPending || emails.length === 0}
            data-testid="button-send-invites"
          >
            {inviteMutation.isPending ? "Sending..." : "Send Invitations"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
