import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  TrendingUp,
  Users,
  User,
  Calendar,
  DollarSign,
  Lock,
  UserCheck,
  ExternalLink,
  Copy,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Link } from "@shared/schema";

interface ViewLinkDialogProps {
  link: Link | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ViewLinkDialog({ link, isOpen, onClose }: ViewLinkDialogProps) {
  const { toast } = useToast();

  const { data: shares = [] } = useQuery<any[]>({
    queryKey: ["/api/links", link?.id, "shares"],
    enabled: isOpen && !!link,
  });

  const { data: clicks = [] } = useQuery<any[]>({
    queryKey: ["/api/links", link?.id, "clicks"],
    enabled: isOpen && !!link,
  });

  if (!link) return null;

  const handleCopy = async () => {
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

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "??";
  };

  const groupShares = shares.filter((share: any) => share.targetType === "group");
  const userShares = shares.filter((share: any) => share.targetType === "contact");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]" data-testid="dialog-view-link">
        <DialogHeader>
          <DialogTitle>{link.title}</DialogTitle>
          <DialogDescription>
            {link.institution && `${link.institution} - `}
            Complete link details and analytics
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>Total Clicks</span>
                </div>
                <p className="text-2xl font-semibold">{link.clickCount}</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Users className="h-4 w-4" />
                  <span>Shared With</span>
                </div>
                <p className="text-2xl font-semibold">{shares.length}</p>
              </Card>
              {link.bonusValue && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Bonus Value</span>
                  </div>
                  <p className="text-2xl font-semibold">{link.bonusValue}</p>
                </Card>
              )}
              <Card className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  {link.visibility === "private" ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                  <span>Visibility</span>
                </div>
                <p className="text-lg font-semibold capitalize">{link.visibility}</p>
              </Card>
            </div>

            {/* Link Details */}
            <div>
              <h3 className="font-semibold mb-3">Link Information</h3>
              <Card className="p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Referral URL</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-muted rounded text-sm break-all">
                      {link.urlEncrypted}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopy}
                      data-testid="button-copy-url"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Category</p>
                    <Badge variant="secondary">{link.category}</Badge>
                  </div>
                  {link.expiresAt && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Expires</p>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {link.notesEncrypted && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{link.notesEncrypted}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <p className="text-sm">
                    {format(new Date(link.createdAt), "PPP 'at' p")}
                  </p>
                </div>
              </Card>
            </div>

            {/* Sharing Information */}
            {shares.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Shared With</h3>
                <div className="space-y-3">
                  {groupShares.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Groups ({groupShares.length})</p>
                      <div className="space-y-2">
                        {groupShares.map((share: any) => (
                          <Card key={share.id} className="p-3">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="font-medium">{share.target?.name || "Unknown Group"}</p>
                                {share.target?.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {share.target.description}
                                  </p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  {userShares.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Users ({userShares.length})</p>
                      <div className="space-y-2">
                        {userShares.map((share: any) => (
                          <Card key={share.id} className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={share.target?.profileImageUrl} />
                                <AvatarFallback>
                                  {getInitials(
                                    share.target?.firstName,
                                    share.target?.lastName,
                                    share.target?.email
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium">
                                  {share.target?.firstName && share.target?.lastName
                                    ? `${share.target.firstName} ${share.target.lastName}`
                                    : share.target?.email || "Unknown User"}
                                </p>
                                {share.target?.firstName && share.target?.lastName && (
                                  <p className="text-sm text-muted-foreground">{share.target.email}</p>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Clicks */}
            {clicks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Recent Activity</h3>
                <Card className="p-4">
                  <div className="space-y-2">
                    {clicks.slice(0, 10).map((click: any, index: number) => (
                      <div key={click.id}>
                        {index > 0 && <Separator className="my-2" />}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Click from {click.referrer || "Direct"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(click.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {clicks.length > 10 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Showing 10 of {clicks.length} clicks
                    </p>
                  )}
                </Card>
              </div>
            )}

            {clicks.length === 0 && (
              <Card className="p-8 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  No clicks yet. Share this link to start tracking activity.
                </p>
              </Card>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} data-testid="button-close-view">
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open(link.urlEncrypted, '_blank')}
            data-testid="button-open-link"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Button>
          <Button
            onClick={handleCopy}
            data-testid="button-copy-link"
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
