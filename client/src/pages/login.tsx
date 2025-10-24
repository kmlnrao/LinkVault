import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Share2, Mail } from "lucide-react";
import { SiGoogle, SiLinkedin, SiFacebook } from "react-icons/si";
import { Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });

      if (response.ok) {
        toast({
          title: "Welcome back!",
          description: "You've successfully logged in.",
        });
        setLocation("/");
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Login failed",
          description: data.message || "Invalid email or password",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during login. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const oauthProviders = [
    {
      name: "Google",
      icon: SiGoogle,
      color: "text-red-600",
      href: "/api/auth/google",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-muted/30">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/">
            <div className="inline-flex items-center gap-2 mb-4 cursor-pointer hover-elevate">
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                <Share2 className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-semibold tracking-tight">LinkVault</span>
            </div>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Card */}
        <Card className="p-6 space-y-6">
          {/* OAuth Providers - shown only if configured */}
          {oauthProviders.length > 0 && (
            <>
              <div className="space-y-3">
                {oauthProviders.map((provider) => (
                  <Button
                    key={provider.name}
                    variant="outline"
                    className="w-full"
                    asChild
                    data-testid={`button-oauth-${provider.name.toLowerCase()}`}
                  >
                    <a href={provider.href}>
                      <provider.icon className={`mr-2 h-4 w-4 ${provider.color}`} />
                      Continue with {provider.name}
                    </a>
                  </Button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password">
                  <a className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                    Forgot password?
                  </a>
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Card>

        {/* Signup Link */}
        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/signup">
            <a className="text-primary font-medium hover:underline" data-testid="link-signup">
              Sign up
            </a>
          </Link>
        </p>
      </div>
    </div>
  );
}
