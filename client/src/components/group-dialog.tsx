import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Group } from "@shared/schema";
import { GROUP_TYPES } from "@shared/schema";

const groupFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required"),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
}

export function GroupDialog({ open, onOpenChange, group }: GroupDialogProps) {
  const { toast } = useToast();
  const isEditing = !!group;

  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: group?.name || "",
      description: group?.description || "",
      type: group?.type || "friends",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: GroupFormValues) => {
      if (isEditing) {
        await apiRequest("PATCH", `/api/groups/${group.id}`, data);
      } else {
        await apiRequest("POST", "/api/groups", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: isEditing ? "Group updated" : "Group created",
        description: `Your group has been ${isEditing ? "updated" : "created"} successfully.`,
      });
      onOpenChange(false);
      form.reset();
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
        description: `Failed to ${isEditing ? "update" : "create"} group. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GroupFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Group" : "Create New Group"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your group details"
              : "Create a private group for sharing referral links"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Family, Close Friends"
                      {...field}
                      data-testid="input-group-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-group-type">
                        <SelectValue placeholder="Select group type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GROUP_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What's this group for?"
                      className="min-h-20"
                      {...field}
                      data-testid="input-group-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Help members understand the purpose of this group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saveMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saveMutation.isPending}
                data-testid="button-save-group"
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Group"
                  : "Create Group"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
