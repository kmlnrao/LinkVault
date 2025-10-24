# LinkVault - Design Guidelines

## Design Approach

**Selected Approach**: Hybrid Reference-Based
- **Primary Inspiration**: Linear (clean, modern productivity), Notion (organized data management), Stripe (trust and professionalism)
- **Rationale**: This is a utility-focused SaaS platform requiring efficiency, clarity, and trust. The design must balance professional credibility (for security/privacy assurance) with ease of use for link management.

**Design Principles**:
1. **Clarity First**: Every interaction should be immediately understandable
2. **Trust Through Design**: Professional, secure aesthetic to reinforce privacy features
3. **Efficient Data Display**: Optimize for scanning and finding links quickly
4. **Progressive Disclosure**: Hide complexity until needed

---

## Typography

**Font Stack**: Inter (Google Fonts) for entire application
- **Headings**: 
  - H1: text-4xl (36px) font-semibold tracking-tight
  - H2: text-2xl (24px) font-semibold
  - H3: text-xl (20px) font-medium
  - H4: text-lg (18px) font-medium
- **Body**: 
  - Primary: text-base (16px) font-normal
  - Small: text-sm (14px) font-normal
  - Tiny: text-xs (12px) font-normal
- **UI Elements**:
  - Buttons: text-sm font-medium
  - Labels: text-sm font-medium
  - Input placeholders: text-sm font-normal
  - Metadata/Stats: text-xs font-medium uppercase tracking-wider

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, m-8)

**Container Strategy**:
- Landing page sections: max-w-7xl mx-auto px-6
- Dashboard main content: max-w-screen-2xl mx-auto
- Form containers: max-w-2xl
- Text content: max-w-prose

**Responsive Breakpoints**:
- Mobile-first approach
- Key breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

---

## Component Library

### Navigation
**Landing Header**: Fixed top navigation with backdrop blur, container max-w-7xl, height h-16, logo left, nav links center, CTA button right

**Dashboard Sidebar**: Fixed left sidebar w-64, full height, sections for Dashboard/Links/Groups/Analytics/Settings with icon + label navigation items, user profile at bottom

**Top App Bar**: Sticky header with search bar (max-w-2xl), notification bell icon, user menu dropdown

### Cards & Content Containers
**Link Cards**: Rounded-lg border with p-6 spacing, includes:
- Title (text-lg font-semibold)
- Institution/category badge (small pill)
- Metadata row (bonus value, expiration date, share count) in text-sm
- Action buttons footer (Share, Edit, Delete icons)
- Visibility indicator (lock icon for private, group icon for shared)

**Group Cards**: Similar structure with group avatar/icon, member count, shared links count, join/manage button

**Dashboard Stat Cards**: Compact cards with large number (text-3xl font-bold), label below, icon top-right, subtle gradient background

### Forms & Inputs
**Input Fields**: h-10 px-4 rounded-md border, focus ring, full width by default
**Text Areas**: min-h-32 px-4 py-3 rounded-md border
**Select Dropdowns**: Custom styled with chevron icon
**Checkboxes/Radio**: Large touch targets (h-5 w-5)
**Form Layout**: Single column, labels above inputs, helper text text-sm below inputs, error states in red with icon

### Buttons
**Primary**: px-6 py-2.5 rounded-md font-medium, solid background
**Secondary**: px-6 py-2.5 rounded-md font-medium, border style
**Ghost/Text**: px-4 py-2 rounded-md font-medium, no background
**Icon Buttons**: p-2 rounded-md, icon only
**Sizes**: Small (px-3 py-1.5 text-sm), Default (px-6 py-2.5), Large (px-8 py-3.5 text-lg)

### Modals & Overlays
**Modal**: Centered overlay with max-w-lg, rounded-xl, shadow-2xl, p-6, header with title and close button, content area, footer with actions
**Dropdown Menus**: Rounded-lg shadow-lg border, min-w-48, py-2, items with px-4 py-2 hover states
**Toasts/Notifications**: Fixed position top-right, rounded-lg, px-4 py-3, auto-dismiss, icon + message + close

### Data Display
**Tables**: Minimal borders, zebra striping for rows, sticky header, responsive (cards on mobile)
**Lists**: Divided list items with py-4 spacing, subtle borders between
**Analytics Charts**: Clean line/bar charts using recharts library, subtle grid lines, clear labels
**Badges/Pills**: Inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
**Empty States**: Centered illustration, heading, description, primary action button

---

## Landing Page Specifications

**Structure** (5-7 sections):

1. **Hero Section** (h-screen): 
   - Full-width hero with gradient background overlay
   - Two-column layout: Left (60%) copy with H1 headline, subheadline, CTA buttons (primary + secondary), trust indicators; Right (40%) hero image/illustration showing dashboard preview
   - Social proof bar below: "Trusted by 10,000+ users • 50,000+ links shared securely"

2. **Features Section**: 
   - Container max-w-6xl, grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8
   - Feature cards with icon (top), title, description, subtle hover lift effect
   - 6 feature cards total showcasing: Secure Auth, Private Groups, Link Organization, Analytics, Contact Import, Cross-platform

3. **How It Works** (Visual Flow):
   - Three-column layout showing numbered steps with connecting arrows
   - Each step: Large number, title, description, supporting icon/illustration

4. **Security & Privacy Section**:
   - Two-column: Left side lists security features with checkmarks, Right side shows encrypted link visualization or trust badges
   - Emphasize encryption, OAuth, privacy-first approach

5. **Pricing Section**:
   - Two or three pricing tiers in cards side-by-side
   - Free, Premium Monthly, Premium Annual
   - Highlight recommended tier, feature comparison table below

6. **Social Proof/Testimonials**:
   - Grid layout with 2-3 testimonial cards including avatar, quote, name, role
   - Or stats showcase: "X links shared" "Y groups created" "Z users"

7. **Final CTA Section**:
   - Centered content with compelling headline, subtext, email capture + CTA button
   - Background: Subtle gradient or pattern
   - Include secondary text: "14-day free trial • No credit card required"

**Footer**: Four-column grid with Product, Company, Resources, Legal links, social icons, newsletter signup, copyright

---

## Images

**Landing Page Images**:
- **Hero Image**: Dashboard mockup showing link cards, clean interface (Right side, 40% width, rounded-xl with subtle shadow)
- **Feature Icons**: Use Heroicons for feature section icons (outline style)
- **How It Works**: Simple illustrations or icons showing workflow
- **Security Section**: Abstract visualization of encryption/security (lock icon, shield)
- **Testimonial Avatars**: Circular placeholder avatars (if using testimonials)

**Dashboard Images**:
- **Empty States**: Minimalist illustrations (line art style)
- **Group Avatars**: Colored circles with initials
- **No results**: Search icon with friendly message

---

## Animations

**Use Sparingly**:
- Page transitions: Simple fade-in
- Card hover: Subtle lift (translate-y-1) and shadow increase
- Modal enter/exit: Scale and fade
- Loading states: Skeleton screens (shimmer effect)
- **No**: Scroll-triggered animations, parallax, complex page transitions