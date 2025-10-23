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
import type { Link } from "@shared/schema";
import { LINK_CATEGORIES, VISIBILITY_OPTIONS } from "@shared/schema";

const linkFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  urlEncrypted: z.string().url("Please enter a valid URL"),
  institution: z.string().max(255).optional(),
  category: z.string().min(1, "Category is required"),
  notesEncrypted: z.string().optional(),
  bonusValue: z.string().max(100).optional(),
  expiresAt: z.string().optional(),
  visibility: z.string().min(1, "Visibility is required"),
});

type LinkFormValues = z.infer<typeof linkFormSchema>;

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link?: Link | null;
}

export function LinkDialog({ open, onOpenChange, link }: LinkDialogProps) {
  const { toast } = useToast();
  const isEditing = !!link;

  const form = useForm<LinkFormValues>({
    resolver: zodResolver(linkFormSchema),
    defaultValues: {
      title: link?.title || "",
      urlEncrypted: link?.urlEncrypted || "",
      institution: link?.institution || "",
      category: link?.category || "",
      notesEncrypted: link?.notesEncrypted || "",
      bonusValue: link?.bonusValue || "",
      expiresAt: link?.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : "",
      visibility: link?.visibility || "private",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: LinkFormValues) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      };

      if (isEditing) {
        await apiRequest("PATCH", `/api/links/${link.id}`, payload);
      } else {
        await apiRequest("POST", "/api/links", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: isEditing ? "Link updated" : "Link created",
        description: `Your referral link has been ${isEditing ? "updated" : "created"} successfully.`,
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
        description: `Failed to ${isEditing ? "update" : "create"} link. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LinkFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Link" : "Add New Link"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update your referral link details"
              : "Add a new referral link to your collection"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Premium Rewards Credit Card"
                      {...field}
                      data-testid="input-link-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="urlEncrypted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/referral/..."
                      {...field}
                      data-testid="input-link-url"
                    />
                  </FormControl>
                  <FormDescription>
                    Your referral link will be encrypted for security
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Chase Bank"
                        {...field}
                        data-testid="input-link-institution"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-link-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LINK_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonusValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus Value (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., $200 or 50,000 points"
                        {...field}
                        data-testid="input-link-bonus"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        data-testid="input-link-expires"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-link-visibility">
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VISIBILITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control who can see this link
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notesEncrypted"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this referral link..."
                      className="min-h-24"
                      {...field}
                      data-testid="input-link-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    Notes will be encrypted for privacy
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
                data-testid="button-save-link"
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Link"
                  : "Create Link"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
