import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Mail,
  Shield,
  Bell,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const getInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (!user) return "User";
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || "User";
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your account information from your authentication provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-2xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-2xl font-semibold" data-testid="text-display-name">
                  {getDisplayName()}
                </p>
                {user?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Account ID</p>
                  </div>
                  <p className="text-sm text-muted-foreground" data-testid="text-user-id">
                    {user?.id}
                  </p>
                </div>
              </div>

              {user?.firstName && (
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Name</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>
              Manage your security settings and authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Authentication Provider</p>
                  <p className="text-sm text-muted-foreground">
                    You're signed in securely via OAuth
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Active</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Notification Preferences</p>
                  <p className="text-sm text-muted-foreground">
                    Email notifications for shares and invites
                  </p>
                </div>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account Actions</CardTitle>
            <CardDescription>
              Manage your account and session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
              data-testid="button-logout-settings"
            >
              <a href="/api/logout">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>
              Information about ReferralLink Platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              ReferralLink Platform is a secure, privacy-focused tool for managing and
              sharing referral links with trusted groups.
            </p>
            <p>
              All your referral URLs are encrypted and stored securely. Links are only
              shared with people and groups you explicitly choose.
            </p>
            <div className="pt-4">
              <p className="text-xs">
                Version 1.0.0 • Built with ❤️ for secure sharing
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
