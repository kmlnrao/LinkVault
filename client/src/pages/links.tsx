import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Share2,
  Lock,
  UserCheck,
  Calendar,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Archive,
  ArchiveRestore,
  Copy,
  Eye,
} from "lucide-react";
import type { Link } from "@shared/schema";
import { LINK_CATEGORIES } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { LinkDialog } from "@/components/link-dialog";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { ViewLinkDialog } from "@/components/view-link-dialog";

export default function LinksPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);

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

  const { data: links = [], isLoading } = useQuery<Link[]>({
    queryKey: ["/api/links"],
    enabled: isAuthenticated,
  });

  const { data: sharedLinks = [], isLoading: isLoadingShared } = useQuery<Link[]>({
    queryKey: ["/api/links/shared/with-me"],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/links/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Link deleted",
        description: "Your referral link has been deleted successfully.",
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
        description: "Failed to delete link. Please try again.",
        variant: "destructive",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      await apiRequest("PATCH", `/api/links/${id}/archive`, { archive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/links"] });
      toast({
        title: "Success",
        description: "Link updated successfully.",
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
        description: "Failed to update link.",
        variant: "destructive",
      });
    },
  });

  const filteredLinks = links.filter((link) => {
    const matchesSearch =
      !searchQuery ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.institution?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || link.category === categoryFilter;
    const matchesVisibility =
      visibilityFilter === "all" || link.visibility === visibilityFilter;
    const matchesArchived = showArchived ? link.isArchived : !link.isArchived;
    return matchesSearch && matchesCategory && matchesVisibility && matchesArchived;
  });

  const handleEdit = (link: Link) => {
    setSelectedLink(link);
    setIsLinkDialogOpen(true);
  };

  const handleShare = (link: Link) => {
    setSelectedLink(link);
    setIsShareDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleArchive = (id: string, archive: boolean) => {
    archiveMutation.mutate({ id, archive });
  };

  const handleCopyLink = async (link: Link) => {
    try {
      await navigator.clipboard.writeText(link.urlEncrypted);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to copy link",
      });
    }
  };

  const handleView = (link: Link) => {
    setSelectedLink(link);
    setIsViewDialogOpen(true);
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
            <h1 className="text-4xl font-semibold tracking-tight mb-2">Links</h1>
            <p className="text-muted-foreground">
              Manage your referral links and view links shared with you.
            </p>
          </div>
          <Button
            onClick={() => {
              setSelectedLink(null);
              setIsLinkDialogOpen(true);
            }}
            data-testid="button-create-link"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Link
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="my-links" className="space-y-6">
          <TabsList>
            <TabsTrigger value="my-links" data-testid="tab-my-links">
              My Links ({links.length})
            </TabsTrigger>
            <TabsTrigger value="shared-with-me" data-testid="tab-shared-with-me">
              Shared With Me ({sharedLinks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-links" className="space-y-6">
        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-links"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {LINK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-visibility">
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="group">Shared with Groups</SelectItem>
                <SelectItem value="contacts">Shared with Contacts</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showArchived ? "default" : "outline"}
              onClick={() => setShowArchived(!showArchived)}
              data-testid="button-toggle-archived"
            >
              <Archive className="mr-2 h-4 w-4" />
              {showArchived ? "Hide" : "Show"} Archived
            </Button>
          </div>
        </Card>

        {/* Links Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <ExternalLink className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {searchQuery || categoryFilter !== "all" || visibilityFilter !== "all"
                  ? "No links found"
                  : "No referral links yet"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || categoryFilter !== "all" || visibilityFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by adding your first referral link."}
              </p>
              {!searchQuery && categoryFilter === "all" && visibilityFilter === "all" && (
                <Button
                  onClick={() => {
                    setSelectedLink(null);
                    setIsLinkDialogOpen(true);
                  }}
                  data-testid="button-add-first-link"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Link
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.map((link) => (
              <Card
                key={link.id}
                className="p-6 hover-elevate space-y-4"
                data-testid={`link-card-${link.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-lg line-clamp-2">{link.title}</h3>
                    {link.institution && (
                      <p className="text-sm text-muted-foreground">{link.institution}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-link-menu-${link.id}`}>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleView(link)} data-testid={`menu-view-${link.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyLink(link)} data-testid={`menu-copy-${link.id}`}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(link)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(link)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchive(link.id, !link.isArchived)}
                      >
                        {link.isArchived ? (
                          <>
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Restore
                          </>
                        ) : (
                          <>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(link.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {link.bonusValue && (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {link.bonusValue}
                    </Badge>
                  )}
                  <Badge variant="secondary">{link.category}</Badge>
                  {link.isArchived && <Badge variant="outline">Archived</Badge>}
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      <span>{link.clickCount} clicks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {link.visibility === "private" ? (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>Private</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-3 w-3" />
                          <span>Shared</span>
                        </>
                      )}
                    </div>
                  </div>
                  {link.expiresAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Expires{" "}
                        {formatDistanceToNow(new Date(link.expiresAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
          </TabsContent>

          <TabsContent value="shared-with-me" className="space-y-6">
            {isLoadingShared ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : sharedLinks.length === 0 ? (
              <Card className="p-12">
                <div className="text-center">
                  <Share2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No shared links</h3>
                  <p className="text-sm text-muted-foreground">
                    Links shared with you by other users will appear here.
                  </p>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedLinks.map((link: any) => (
                  <Card
                    key={link.id}
                    className="p-6 hover-elevate space-y-4"
                    data-testid={`shared-link-card-${link.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg line-clamp-2">{link.title}</h3>
                        {link.institution && (
                          <p className="text-sm text-muted-foreground">{link.institution}</p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleCopyLink(link)} data-testid={`button-copy-shared-${link.id}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {link.bonusValue && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <DollarSign className="h-3 w-3 mr-1" />
                          {link.bonusValue}
                        </Badge>
                      )}
                      <Badge variant="secondary">{link.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        Shared
                      </Badge>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span>{link.clickCount} clicks</span>
                        </div>
                      </div>
                      {link.expiresAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Expires{" "}
                            {formatDistanceToNow(new Date(link.expiresAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      )}
                      {link.sharedAt && (
                        <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                          Shared {formatDistanceToNow(new Date(link.sharedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <LinkDialog
        open={isLinkDialogOpen}
        onOpenChange={setIsLinkDialogOpen}
        link={selectedLink}
      />
      <ShareLinkDialog
        linkId={selectedLink?.id || ""}
        linkTitle={selectedLink?.title || ""}
        isOpen={isShareDialogOpen && !!selectedLink}
        onClose={() => setIsShareDialogOpen(false)}
      />
      <ViewLinkDialog
        link={selectedLink}
        isOpen={isViewDialogOpen}
        onClose={() => setIsViewDialogOpen(false)}
      />
    </div>
  );
}
