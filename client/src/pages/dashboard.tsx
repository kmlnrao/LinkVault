import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Link2,
  Users,
  TrendingUp,
  Plus,
  ExternalLink,
  Calendar,
  DollarSign,
  Eye,
  Lock,
  UserCheck,
} from "lucide-react";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Link, Group, Notification } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

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

  const { data: links = [], isLoading: linksLoading } = useQuery<Link[]>({
    queryKey: ["/api/links"],
    enabled: isAuthenticated,
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const stats = {
    totalLinks: links.length,
    totalClicks: links.reduce((sum, link) => sum + (link.clickCount || 0), 0),
    totalGroups: groups.length,
    activeLinks: links.filter((link) => !link.isArchived).length,
  };

  const recentLinks = links.slice(0, 5);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-screen-2xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your referral links.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild data-testid="button-create-group">
              <a href="/groups">
                <Users className="mr-2 h-4 w-4" />
                Create Group
              </a>
            </Button>
            <Button asChild data-testid="button-add-link">
              <a href="/links">
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </a>
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Links</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="stat-total-links">{stats.totalLinks}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.activeLinks} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="stat-total-clicks">{stats.totalClicks}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all links
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {groupsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="stat-total-groups">{stats.totalGroups}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Private sharing groups
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="stat-notifications">
                    {notifications.filter((n) => !n.isRead).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unread updates
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Links */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Links</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <a href="/links">
                  View All <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {linksLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : recentLinks.length === 0 ? (
              <div className="text-center py-12">
                <Link2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No referral links yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started by adding your first referral link.
                </p>
                <Button asChild data-testid="button-add-first-link">
                  <a href="/links">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Link
                  </a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentLinks.map((link) => (
                  <div
                    key={link.id}
                    className="border rounded-lg p-4 hover-elevate space-y-3"
                    data-testid={`link-card-${link.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-semibold text-lg">{link.title}</h3>
                        {link.institution && (
                          <p className="text-sm text-muted-foreground">{link.institution}</p>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        {link.bonusValue && (
                          <Badge className="bg-primary/10 text-primary border-primary/20">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {link.bonusValue}
                          </Badge>
                        )}
                        <Badge variant="secondary">{link.category}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        <span>{link.clickCount} clicks</span>
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
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
