# LinkVault

## Overview

LinkVault is a secure, subscription-based web application for managing and sharing referral links for credit cards, bank accounts, and other incentive-based programs. The platform emphasizes privacy and security by allowing users to share referral links only within trusted private groups rather than public forums. Users can organize their links by category, track click analytics, and manage group memberships to maximize rewards while maintaining control over who sees their referral codes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool and development server.

**UI Component System**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design follows a hybrid approach inspired by Linear (clean, modern), Notion (organized data management), and Stripe (trust and professionalism).

**Styling Strategy**: Tailwind CSS with custom design tokens for colors, spacing, and typography. The application uses Inter font throughout and follows a mobile-first responsive design approach with specific breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px).

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. Authentication state is managed through a custom `useAuth` hook that queries the current user endpoint.

**Routing**: Wouter for client-side routing, chosen for its lightweight footprint compared to React Router.

**Key Design Patterns**:
- Component composition with Radix UI primitives for accessibility
- Custom hooks for reusable logic (useAuth, useToast, useIsMobile)
- Dialog-based workflows for creating/editing links and groups
- Responsive sidebar layout with mobile sheet overlay

### Backend Architecture

**Runtime**: Node.js with Express.js framework, written in TypeScript.

**API Design**: RESTful API with endpoints organized by resource (auth, links, groups, shares, analytics). Routes are registered centrally in `server/routes.ts`.

**Authentication**: OpenID Connect (OIDC) integration via Replit Auth using Passport.js strategy. Session management is handled through express-session with PostgreSQL session store (connect-pg-simple).

**Data Access Layer**: Storage abstraction pattern through `IStorage` interface in `server/storage.ts`, allowing for flexible implementation changes. Current implementation uses Drizzle ORM directly.

**Security Measures**:
- Referral URLs are encrypted using AES-256-GCM before storage
- IP addresses and user agents are hashed for click tracking analytics
- Session cookies are HTTP-only, secure, and have 7-day TTL
- CSRF protection through session-based authentication

**Key Architectural Decisions**:
- Monolithic architecture with client and server in single repository for simplicity
- Session-based authentication chosen over JWT for better security and revocation capabilities
- Encryption key stored in environment variable (should use KMS in production)
- Storage interface abstraction allows switching ORM or database without changing business logic

### Data Storage

**Database**: PostgreSQL accessed through Neon's serverless driver with WebSocket support.

**ORM**: Drizzle ORM for type-safe database queries and schema management.

**Schema Design**:
- `users`: User profiles from OIDC authentication
- `links`: Encrypted referral links with metadata (category, institution, bonus value, expiration)
- `groups`: Private groups for sharing links
- `group_memberships`: Many-to-many relationship between users and groups with role support
- `shares`: Links shared to specific groups or individuals
- `click_events`: Analytics data with hashed IP/user agent for privacy
- `notifications`: User notification system
- `sessions`: Session storage for Passport.js

**Data Encryption**: Sensitive fields (link URLs, notes) are encrypted at application level before database storage using the encryption utility in `server/lib/encryption.ts`.

**Migration Strategy**: Drizzle Kit manages schema migrations with files stored in `/migrations` directory.

### External Dependencies

**Authentication Provider**: Replit OIDC service for user authentication (configurable issuer URL via `ISSUER_URL` environment variable).

**Database Service**: Neon PostgreSQL serverless database (connection via `DATABASE_URL` environment variable).

**UI Component Libraries**:
- Radix UI primitives for accessible, unstyled components
- Lucide React for icons
- date-fns for date formatting and manipulation

**Development Tools**:
- Replit-specific Vite plugins for runtime error overlay, cartographer, and dev banner
- TypeScript for type safety across frontend and backend
- ESBuild for production server bundling

**Environment Variables Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `REPL_ID`: Replit environment identifier for OIDC
- `ISSUER_URL`: OIDC issuer URL (defaults to https://replit.com/oidc)
- `SESSION_SECRET`: Secret for session encryption
- `ENCRYPTION_KEY`: Key for encrypting sensitive data (32 characters minimum)
- `REPLIT_DOMAINS`: Allowed domains for CORS/authentication