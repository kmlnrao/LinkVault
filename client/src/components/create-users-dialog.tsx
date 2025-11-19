import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Contact } from "@shared/schema";

interface CreateUsersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
}

export function CreateUsersDialog({ open, onOpenChange, contacts }: CreateUsersDialogProps) {
  const { toast } = useToast();
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Array<{ contactId: string; email: string; error: string }>>([]);

  // Filter for non-registered contacts only
  const nonRegisteredContacts = contacts.filter(
    (contact) => !contact.metadata?.matchedUserId
  );

  const createUsersMutation = useMutation({
    mutationFn: async (data: { users: Array<{ contactId: string; password: string }> }) => {
      const response = await apiRequest("/api/contacts/create-users", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
      return response;
    },
    onSuccess: (data) => {
      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
        toast({
          title: "Partial Success",
          description: data.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Success!",
          description: data.message,
        });
        onOpenChange(false);
        resetForm();
      }
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user accounts",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedContacts(new Set());
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setErrors([]);
  };

  const handleSelectContact = (contactId: string, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContacts(new Set(nonRegisteredContacts.map((c) => c.id)));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const handleCreateUsers = () => {
    // Validation
    if (selectedContacts.size === 0) {
      toast({
        title: "No contacts selected",
        description: "Please select at least one contact to create a user account for.",
        variant: "destructive",
      });
      return;
    }

    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter a password for the new user accounts.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure the passwords match.",
        variant: "destructive",
      });
      return;
    }

    // Create users data with same password for all
    const usersData = Array.from(selectedContacts).map((contactId) => ({
      contactId,
      password,
    }));

    createUsersMutation.mutate({ users: usersData });
  };

  const handleClose = () => {
    if (!createUsersMutation.isPending) {
      onOpenChange(false);
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create User Accounts
          </DialogTitle>
          <DialogDescription>
            Create LinkVault user accounts for your non-registered contacts. They will be able to login with their email and the password you set.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {nonRegisteredContacts.length === 0 ? (
            <Alert>
              <AlertDescription>
                All your contacts are already registered LinkVault users. There are no contacts available to create accounts for.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedContacts.size === nonRegisteredContacts.length && nonRegisteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                  <Label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Select All ({nonRegisteredContacts.length} contacts)
                  </Label>
                </div>

                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-4 space-y-2">
                    {nonRegisteredContacts.map((contact) => (
                      <Card key={contact.id} className="overflow-hidden">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              id={`contact-${contact.id}`}
                              checked={selectedContacts.has(contact.id)}
                              onCheckedChange={(checked) => handleSelectContact(contact.id, checked as boolean)}
                              data-testid={`checkbox-contact-${contact.id}`}
                            />
                            <div className="flex-1 min-w-0">
                              <Label
                                htmlFor={`contact-${contact.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {contact.contactName || "No name"}
                              </Label>
                              <p className="text-sm text-muted-foreground truncate">
                                {contact.contactEmail}
                              </p>
                              {contact.contactPhone && (
                                <p className="text-xs text-muted-foreground">
                                  {contact.contactPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password for new accounts</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={createUsersMutation.isPending}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This password will be set for all selected user accounts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={createUsersMutation.isPending}
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <p className="font-semibold mb-2">Failed to create {errors.length} user account(s):</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {errors.map((error, idx) => (
                        <li key={idx}>
                          {error.email}: {error.error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={createUsersMutation.isPending}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          {nonRegisteredContacts.length > 0 && (
            <Button
              onClick={handleCreateUsers}
              disabled={createUsersMutation.isPending || selectedContacts.size === 0}
              data-testid="button-create-users"
            >
              {createUsersMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create {selectedContacts.size} User{selectedContacts.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
