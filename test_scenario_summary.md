# LinkVault Test Scenario Summary

This document outlines comprehensive test scenarios for the LinkVault application, covering all implemented features and functionality.

## 1. Authentication & User Management

### 1.1 OAuth Authentication
**Providers**: Google, Microsoft, LinkedIn, Facebook

**Test Scenarios**:
- [ ] User can sign up using Google OAuth
- [ ] User can sign up using Microsoft OAuth
- [ ] User can sign up using LinkedIn OAuth
- [ ] User can sign up using Facebook OAuth
- [ ] User can log in with existing OAuth account
- [ ] OAuth profile data (name, email, profile image) is properly synced
- [ ] User can log out and log back in with OAuth

### 1.2 Email/Password Authentication
**Feature**: Traditional email and password authentication

**Test Scenarios**:
- [ ] User can sign up with email and password (minimum 8 characters)
- [ ] User can log in with email and password
- [ ] Invalid email format is rejected during signup
- [ ] Weak passwords (< 8 characters) are rejected
- [ ] Incorrect password shows appropriate error message
- [ ] Non-existent email shows appropriate error message
- [ ] User can access forgot password functionality

### 1.3 Phone Number Authentication (NEW)
**Feature**: Amazon-style authentication using phone number instead of email

**Test Scenarios**:
- [ ] User can sign up with ONLY phone number (no email required)
- [ ] User can sign up with ONLY email (no phone required)
- [ ] User can sign up with BOTH email and phone
- [ ] User can log in using phone number and password
- [ ] User can log in using email and password
- [ ] Phone number uniqueness is enforced (duplicate phone numbers rejected)
- [ ] Phone number field accepts international formats (+1234567890)
- [ ] Login field accepts both email and phone number interchangeably
- [ ] Validation requires at least one of email OR phone during signup
- [ ] Phone verification status is tracked (phoneVerified field)

### 1.4 Session Management
**Test Scenarios**:
- [ ] User session persists across page refreshes
- [ ] User session expires after 7 days
- [ ] User can log out successfully
- [ ] Multiple sessions can be active (different browsers/devices)

## 2. Link Management

### 2.1 Create Links
**Test Scenarios**:
- [ ] User can create a new referral link with all required fields
- [ ] Link URL is encrypted before storage
- [ ] Categories: Credit Cards, Bank Accounts, Brokerage, Other
- [ ] Optional fields work correctly: institution, bonus value, expiration date, notes
- [ ] Expiration date defaults to 90 days from creation
- [ ] Links are only visible to the owner initially

### 2.2 View Links
**Test Scenarios**:
- [ ] User can view all their created links
- [ ] Links are displayed with proper decryption
- [ ] Links can be filtered by category
- [ ] Links show creation date and expiration status
- [ ] Expired links are visually distinguished
- [ ] User cannot see other users' private links

### 2.3 Edit Links
**Test Scenarios**:
- [ ] User can edit their own links
- [ ] All fields can be updated (URL, category, institution, bonus, expiration, notes)
- [ ] Changes are encrypted and saved properly
- [ ] User cannot edit links they don't own

### 2.4 Delete Links
**Test Scenarios**:
- [ ] User can delete their own links
- [ ] Deletion confirmation is required
- [ ] Deleted links are removed from all shares
- [ ] User cannot delete links they don't own

## 3. Group Management

### 3.1 Create Groups
**Test Scenarios**:
- [ ] User can create a new private group
- [ ] Group creator is automatically set as owner
- [ ] Group name and description are required
- [ ] Groups are private by default

### 3.2 View Groups
**Test Scenarios**:
- [ ] User can see all groups they're a member of
- [ ] User can see groups they own separately
- [ ] Group member count is displayed
- [ ] User cannot see groups they're not a member of

### 3.3 Manage Group Members
**Test Scenarios**:
- [ ] Group owner can add members by email
- [ ] Group owner can remove members
- [ ] Group owner can change member roles (member/admin)
- [ ] Group admins can add/remove members (if given permission)
- [ ] Members can view but not manage other members
- [ ] Members can leave groups they're part of
- [ ] Owner cannot be removed from the group

### 3.4 Delete Groups
**Test Scenarios**:
- [ ] Only group owner can delete the group
- [ ] Deletion confirmation is required
- [ ] All group shares are removed when group is deleted
- [ ] Group members are notified of deletion

## 4. Link Sharing

### 4.1 Share to Groups
**Test Scenarios**:
- [ ] User can share their link to groups they're a member of
- [ ] All group members can see shared links
- [ ] Shared links show who shared them
- [ ] User can unshare links from groups
- [ ] When link is deleted, shares are removed

### 4.2 Share to Individuals
**Test Scenarios**:
- [ ] User can share link directly to another user by email
- [ ] Recipient can view shared link
- [ ] User can revoke individual shares
- [ ] Recipient is notified when link is shared with them

### 4.3 Visibility Controls
**Test Scenarios**:
- [ ] Links can be set to Private (owner only)
- [ ] Links can be set to Shared (specific groups/users)
- [ ] Links default to Private visibility
- [ ] Visibility changes are reflected immediately

## 5. Analytics & Tracking

### 5.1 Click Tracking
**Test Scenarios**:
- [ ] Clicks on referral links are tracked
- [ ] Click count increments correctly
- [ ] Click timestamps are recorded
- [ ] IP addresses are hashed for privacy
- [ ] User agents are hashed for privacy

### 5.2 Analytics Dashboard
**Test Scenarios**:
- [ ] User can view total clicks per link
- [ ] User can view click history/timeline
- [ ] Analytics are only visible to link owner
- [ ] Click data respects privacy (hashed IPs/agents)

## 6. Notifications

### 6.1 In-App Notifications
**Test Scenarios**:
- [ ] User receives notification when added to a group
- [ ] User receives notification when link is shared with them
- [ ] User receives notification when removed from a group
- [ ] Notifications are marked as read/unread
- [ ] User can view notification history
- [ ] Notification count badge updates in real-time

### 6.2 Notification Actions
**Test Scenarios**:
- [ ] User can mark notifications as read
- [ ] User can delete notifications
- [ ] User can navigate to related content from notification
- [ ] Old notifications are auto-archived after 30 days

## 7. Security & Privacy

### 7.1 Data Encryption
**Test Scenarios**:
- [ ] Referral URLs are encrypted in database
- [ ] Private notes are encrypted in database
- [ ] Decryption only occurs when authorized user requests
- [ ] Encryption uses AES-256-GCM

### 7.2 Access Control
**Test Scenarios**:
- [ ] Users can only access their own links
- [ ] Users can only access groups they're members of
- [ ] Unauthorized access attempts are blocked
- [ ] API endpoints validate user permissions

### 7.3 Privacy Features
**Test Scenarios**:
- [ ] IP addresses are hashed before storage
- [ ] User agents are hashed before storage
- [ ] Sensitive data is not logged
- [ ] Sessions are secure (HTTP-only, secure cookies)

## 8. User Interface & Experience

### 8.1 Responsive Design
**Test Scenarios**:
- [ ] Application works on mobile devices (320px+)
- [ ] Application works on tablets (768px+)
- [ ] Application works on desktop (1024px+)
- [ ] Sidebar collapses on mobile
- [ ] Forms are usable on all screen sizes

### 8.2 Navigation
**Test Scenarios**:
- [ ] User can navigate between Links, Groups, Analytics, Profile
- [ ] Sidebar navigation works correctly
- [ ] Back button works as expected
- [ ] Deep links work (can bookmark specific pages)

### 8.3 Error Handling
**Test Scenarios**:
- [ ] Form validation errors are clearly displayed
- [ ] Network errors show user-friendly messages
- [ ] 404 pages are handled gracefully
- [ ] Server errors show appropriate messages
- [ ] Loading states are shown during async operations

## 9. Edge Cases & Error Scenarios

### 9.1 Data Validation
**Test Scenarios**:
- [ ] Empty form submissions are rejected
- [ ] Invalid URLs in links are rejected
- [ ] Invalid email formats are rejected
- [ ] Invalid phone formats are handled gracefully
- [ ] XSS attempts are sanitized
- [ ] SQL injection attempts are prevented

### 9.2 Concurrent Actions
**Test Scenarios**:
- [ ] Multiple users can edit different links simultaneously
- [ ] Concurrent group membership changes are handled
- [ ] Simultaneous shares to same group work correctly
- [ ] Race conditions in click tracking are handled

### 9.3 Data Integrity
**Test Scenarios**:
- [ ] Deleting a user cascades properly (links, shares, memberships)
- [ ] Deleting a group removes all shares
- [ ] Deleting a link removes all shares
- [ ] Foreign key constraints are enforced

## 10. Performance

### 10.1 Load Times
**Test Scenarios**:
- [ ] Initial page load < 2 seconds
- [ ] Link list loads < 500ms
- [ ] Group list loads < 500ms
- [ ] Search/filter operations < 200ms

### 10.2 Scalability
**Test Scenarios**:
- [ ] Application handles 100+ links per user
- [ ] Application handles 50+ groups per user
- [ ] Click tracking handles high volume
- [ ] Database queries are optimized (no N+1)

## Testing Notes

### Current Implementation Status
- ✅ OAuth authentication (Google, Microsoft, LinkedIn, Facebook)
- ✅ Email/password authentication
- ✅ Phone number authentication (NEW)
- ✅ Link CRUD operations with encryption
- ✅ Group CRUD operations
- ✅ Group member management
- ✅ Link sharing to groups
- ✅ Link sharing to individuals
- ✅ Click tracking with privacy (hashed IP/agents)
- ✅ In-app notifications
- ✅ Responsive sidebar layout
- ❌ Phone number verification flow (planned)
- ❌ Email verification flow (planned)
- ❌ Share links to non-users via email/phone (planned)
- ❌ Stripe integration (explicitly removed per user request)

### Testing Priorities
1. **High Priority**: Authentication flows (all providers + email/phone)
2. **High Priority**: Link encryption and access control
3. **High Priority**: Group membership and sharing
4. **Medium Priority**: Click tracking and analytics
5. **Medium Priority**: Notifications
6. **Low Priority**: Edge cases and performance

### Known Limitations
- Phone numbers are stored but not verified (verification flow not implemented)
- Email verification is not implemented
- Sharing to non-users requires invitation system (not yet implemented)
- No email/SMS sending capability for external notifications
