// Helper to check which auth providers are available
// This would ideally be fetched from an API endpoint, but for now we'll
// just assume email/password is always available

export interface AuthProvider {
  name: string;
  icon: any;
  color: string;
  href: string;
  available: boolean;
}

export function getAvailableProviders(): AuthProvider[] {
  // In production, you would fetch this from an API endpoint
  // For now, only email/password authentication is available
  // OAuth providers require environment credentials to be configured
  
  return [];
  
  // When OAuth is configured, uncomment and use:
  // return [
  //   {
  //     name: "Google",
  //     icon: SiGoogle,
  //     color: "text-red-600",
  //     href: "/api/auth/google",
  //     available: true,
  //   },
  //   // ... other providers
  // ];
}
