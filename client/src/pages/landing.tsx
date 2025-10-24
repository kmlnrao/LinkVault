import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Users,
  FolderKanban,
  BarChart3,
  Lock,
  Share2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Shield,
      title: "Secure Authentication",
      description:
        "Log in securely with your preferred provider. Your data is encrypted and protected.",
    },
    {
      icon: Users,
      title: "Private Groups",
      description:
        "Create private groups for family, friends, or colleagues to share links safely.",
    },
    {
      icon: FolderKanban,
      title: "Smart Organization",
      description:
        "Categorize links by type, institution, or bonus value for quick access.",
    },
    {
      icon: BarChart3,
      title: "Analytics & Tracking",
      description:
        "Track clicks and performance to see which referral links work best.",
    },
    {
      icon: Lock,
      title: "Privacy First",
      description:
        "All referral URLs are encrypted. Share only with trusted contacts.",
    },
    {
      icon: Share2,
      title: "Easy Sharing",
      description:
        "Share links with specific groups or individuals—no public exposure.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Sign Up & Connect",
      description: "Create your account and start adding your referral links.",
    },
    {
      number: "02",
      title: "Organize & Categorize",
      description: "Group your links by category and create private sharing groups.",
    },
    {
      number: "03",
      title: "Share Securely",
      description: "Share with trusted contacts and track your referral success.",
    },
  ];

  const securityFeatures = [
    "End-to-end URL encryption",
    "Secure OAuth authentication",
    "Private-by-default sharing",
    "No public link exposure",
    "Granular access controls",
    "Activity monitoring",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <Share2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">LinkVault</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Security
            </a>
          </nav>
          <Button asChild data-testid="button-login">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Secure Referral Management</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Share Referral Links{" "}
                <span className="text-primary">Privately & Securely</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Maximize your referral bonuses with a secure platform designed for
                privacy. Organize links, create trusted groups, and never miss a
                sign-up reward again.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild data-testid="button-get-started">
                  <Link href="/login">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Learn More</a>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>No credit card</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Fully encrypted</span>
                </div>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="rounded-xl border bg-card shadow-2xl p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <h3 className="text-lg font-semibold">My Referral Links</h3>
                    <Badge variant="secondary">12 Links</Badge>
                  </div>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4 hover-elevate space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold">Premium Credit Card</p>
                          <p className="text-sm text-muted-foreground">Chase Bank</p>
                        </div>
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          $200 Bonus
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Credit Cards</span>
                        <span>•</span>
                        <span>12 clicks</span>
                        <span>•</span>
                        <Lock className="h-3 w-3" />
                        <span>Private</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Everything You Need to Maximize Rewards
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete platform for managing and sharing referral links with
              privacy and security at the core.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover-elevate transition-all">
                <feature.icon className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                Privacy & Security First
              </h2>
              <p className="text-lg text-muted-foreground">
                Your referral links are valuable—we take protecting them seriously
                with industry-standard encryption and security practices.
              </p>
              <div className="space-y-3">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl" />
                <div className="relative h-64 w-64 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                  <Shield className="h-32 w-32 text-primary-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Ready to Maximize Your Referral Rewards?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of users who are securely managing and sharing their
            referral links.
          </p>
          <Button size="lg" asChild data-testid="button-cta-bottom">
            <Link href="/login">
              Start For Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ReferralLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
