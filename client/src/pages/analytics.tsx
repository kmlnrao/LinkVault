import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Link2,
  Eye,
  Calendar,
  Award,
} from "lucide-react";
import type { Link } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

export default function AnalyticsPage() {
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

  const { data: links = [], isLoading } = useQuery<Link[]>({
    queryKey: ["/api/links"],
    enabled: isAuthenticated,
  });

  const analytics = {
    totalClicks: links.reduce((sum, link) => sum + (link.clickCount || 0), 0),
    totalLinks: links.length,
    averageClicksPerLink: links.length > 0
      ? Math.round((links.reduce((sum, link) => sum + (link.clickCount || 0), 0) / links.length) * 10) / 10
      : 0,
    topPerforming: [...links].sort((a, b) => (b.clickCount || 0) - (a.clickCount || 0)).slice(0, 5),
    recentActivity: [...links]
      .filter(link => link.clickCount > 0)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10),
    byCategory: links.reduce((acc, link) => {
      const category = link.category;
      if (!acc[category]) {
        acc[category] = { count: 0, clicks: 0 };
      }
      acc[category].count++;
      acc[category].clicks += link.clickCount || 0;
      return acc;
    }, {} as Record<string, { count: number; clicks: number }>),
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
      <div className="max-w-screen-2xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Track the performance of your referral links.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="metric-total-clicks">
                    {analytics.totalClicks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all links
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="metric-active-links">
                    {analytics.totalLinks}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total referral links
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Clicks/Link</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="metric-avg-clicks">
                    {analytics.averageClicksPerLink}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average performance
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="metric-categories">
                    {Object.keys(analytics.byCategory).length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Link categories
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Performing Links */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Links</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : analytics.topPerforming.length === 0 ? (
              <div className="text-center py-12">
                <Eye className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No click data available yet. Share your links to see analytics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.topPerforming.map((link, index) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                    data-testid={`top-link-${link.id}`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{link.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {link.category}
                          </Badge>
                          {link.institution && <span>{link.institution}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-2xl font-bold">{link.clickCount}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">clicks</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Performance by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : Object.keys(analytics.byCategory).length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Add links to see category analytics.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(analytics.byCategory)
                  .sort(([, a], [, b]) => b.clicks - a.clicks)
                  .map(([category, data]) => (
                    <div
                      key={category}
                      className="flex items-center justify-between p-3 rounded-lg border"
                      data-testid={`category-${category}`}
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{category}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {data.count} {data.count === 1 ? "link" : "links"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{data.clicks}</span>
                        <span className="text-sm text-muted-foreground">clicks</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : analytics.recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No recent activity to display.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {analytics.recentActivity.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                    data-testid={`activity-${link.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{link.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {link.clickCount} clicks • Updated{" "}
                        {formatDistanceToNow(new Date(link.updatedAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Badge variant="secondary">{link.category}</Badge>
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
