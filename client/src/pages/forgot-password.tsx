import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Share2, ArrowLeft, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("/api/auth/forgot-password", "POST", { email });

      if (response.ok) {
        setIsSubmitted(true);
        toast({
          title: "Check your email",
          description: "If an account exists with that email, we've sent password reset instructions.",
        });
      } else {
        // Still show success to prevent email enumeration
        setIsSubmitted(true);
        toast({
          title: "Check your email",
          description: "If an account exists with that email, we've sent password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <span className="text-2xl font-semibold tracking-tight">ReferralLink</span>
            </div>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight">Forgot password?</h1>
          <p className="text-muted-foreground">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Forgot Password Card */}
        <Card className="p-6 space-y-6">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsSubmitted(false)}
                data-testid="button-try-again"
              >
                Try another email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-reset"
              >
                {isLoading ? "Sending..." : "Send reset instructions"}
              </Button>
            </form>
          )}
        </Card>

        {/* Back to Login */}
        <Link href="/login">
          <Button
            variant="ghost"
            className="w-full"
            data-testid="button-back-to-login"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to login
          </Button>
        </Link>
      </div>
    </div>
  );
}
