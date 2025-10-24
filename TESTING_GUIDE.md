# LinkVault - End-to-End Testing Guide

## Overview
This guide demonstrates how to test the complete multi-user referral link sharing workflow using the group invitation system.

## Multi-User Group Sharing Workflow

### Scenario: Two Users Sharing Referral Links via Private Group

**Characters:**
- **Alice** (Group Owner) - Has credit card referral links to share
- **Bob** (Group Member) - Wants to access Alice's referral links

---

## Step-by-Step Testing Workflow

### Part 1: Alice Creates Account and Group

#### 1. Alice Signs Up
1. Navigate to `/signup`
2. Fill in registration form:
   - Email: `alice@example.com`
   - Password: `SecurePass123!`
   - First Name: `Alice`
   - Last Name: `Smith`
3. Click "Sign Up" button
4. **Expected Result**: Alice is logged in and redirected to homepage

#### 2. Alice Creates a Private Group
1. Click "Groups" in sidebar navigation
2. Click "Create Group" button (data-testid="button-create-group")
3. Fill in group creation form:
   - **Name**: "Family Credit Cards"
   - **Description**: "Share premium credit card referral links with trusted family members"
   - **Type**: Select "family" from dropdown
4. Click "Create" button
5. **Expected Result**: 
   - Success toast notification appears
   - New group "Family Credit Cards" appears in groups list
   - Group shows invite code (e.g., `ABC123XYZ`)

#### 3. Alice Creates Referral Links
1. Click "Links" in sidebar navigation
2. Click "Add Link" or "Create Link" button
3. Fill in link form:
   - **Title**: "Chase Sapphire Preferred"
   - **URL**: `https://www.chase.com/referral/alice123`
   - **Category**: "Credit Cards"
   - **Institution**: "Chase"
   - **Bonus Value**: "$750 + 75,000 points"
   - **Notes**: "Best travel rewards card - apply before March 2025"
4. Click "Create" button
5. **Expected Result**: Link appears in links list

6. Repeat to create second link:
   - **Title**: "American Express Platinum"
   - **URL**: `https://www.americanexpress.com/refer/alice456`
   - **Category**: "Credit Cards"
   - **Institution**: "American Express"
   - **Bonus Value**: "80,000 points"
7. **Expected Result**: Both links visible in links list

#### 4. Alice Shares Links with Group
1. On Links page, click on "Chase Sapphire Preferred" link
2. Click "Share" button or icon
3. In share dialog:
   - Select target type: "Group"
   - Select group: "Family Credit Cards"
4. Click "Share" button
5. **Expected Result**: 
   - Success message "Link shared successfully"
   - Link shows as "Shared" with group indicator

6. Repeat for "American Express Platinum" link
7. **Expected Result**: Both links now shared with "Family Credit Cards" group

#### 5. Alice Generates Invite Code
1. Navigate to "Groups" page
2. Click on "Family Credit Cards" group
3. Click "Invite" button or "Generate Invite Code"
4. **Expected Result**: 
   - Invite code is displayed (e.g., `FAMILY-ABC-123`)
   - Copy button appears next to code
5. Copy invite code to share with Bob

---

### Part 2: Bob Joins Group and Accesses Shared Links

#### 6. Bob Signs Up
1. Open new incognito browser window (or different browser)
2. Navigate to `/signup`
3. Fill in registration form:
   - Email: `bob@example.com`
   - Password: `SecurePass456!`
   - First Name: `Bob`
   - Last Name: `Johnson`
4. Click "Sign Up" button
5. **Expected Result**: Bob is logged in and redirected to homepage

#### 7. Bob Joins Alice's Group Using Invite Code
1. Click "Groups" in sidebar navigation
2. Click "Join Group" button (data-testid="button-join-group")
3. Enter invite code: `FAMILY-ABC-123` (the code Alice generated)
4. Click "Join" button
5. **Expected Result**:
   - Success message "Successfully joined group"
   - "Family Credit Cards" group appears in Bob's groups list
   - Bob sees role: "member"

#### 8. Bob Views Shared Links
1. Click on "Family Credit Cards" group to view details
2. Navigate to "Shared Links" tab or section
3. **Expected Result**: Bob sees:
   - Chase Sapphire Preferred ($750 + 75,000 points)
   - American Express Platinum (80,000 points)
   - Each link shows: Title, Institution, Bonus Value, Notes
   - "Shared by Alice Smith" indicator

#### 9. Bob Clicks on Referral Link
1. Click on "Chase Sapphore Preferred" link
2. **Expected Result**:
   - Link details page opens OR
   - "Copy Link" button appears
3. Click "Copy Link" or "View URL" button
4. **Expected Result**:
   - Referral URL is decrypted and displayed
   - Click tracking is recorded
   - Toast message "Link copied to clipboard"

---

### Part 3: Alice Monitors Group Activity

#### 10. Alice Views Group Members
1. Switch back to Alice's browser session
2. Navigate to Groups → "Family Credit Cards"
3. Click "Members" tab
4. **Expected Result**: Alice sees:
   - **Alice Smith** - Role: Owner
   - **Bob Johnson** - Role: Member

#### 11. Alice Checks Link Analytics
1. Navigate to Links page
2. Click on "Chase Sapphire Preferred"
3. View analytics section
4. **Expected Result**: Alice sees:
   - **Total Clicks**: 1
   - **Recent Activity**: Shows Bob clicked the link
   - Click timestamp and hashed user info (for privacy)

---

### Part 4: Group Management

#### 12. Alice Updates Group Settings
1. On Groups page, click "Family Credit Cards"
2. Click "Edit" button
3. Update description to "Premium credit card referrals - updated Feb 2025"
4. Click "Save"
5. **Expected Result**: Updated description visible to all members

#### 13. Alice Adds More Links to Group
1. Create new link:
   - **Title**: "Capital One Venture X"
   - **URL**: `https://capital1.com/refer/alice789`
   - **Category**: "Credit Cards"
   - **Institution**: "Capital One"
   - **Bonus Value**: "100,000 miles"
2. Share with "Family Credit Cards" group
3. **Expected Result**: 
   - Bob automatically sees new link in group
   - Bob receives notification (if notifications enabled)

#### 14. Bob Views Notification
1. Switch to Bob's session
2. Click notifications icon in header
3. **Expected Result**: Notification shows:
   - "New link shared"
   - "Capital One Venture X was shared with your group"
   - Click notification to view link

---

## Testing Variations

### Scenario 2: Multiple Groups
1. Alice creates second group: "College Friends"
2. Alice shares different links with different groups
3. Verify group members only see links shared with their specific group

### Scenario 3: Bob Shares Links
1. Bob creates his own referral link
2. Bob shares it with "Family Credit Cards" group
3. Verify Alice receives notification
4. Verify Alice can access Bob's shared link

### Scenario 4: Group Removal
1. Alice removes Bob from "Family Credit Cards" group
2. **Expected Result**:
   - Bob loses access to group's shared links
   - Bob's groups list no longer shows "Family Credit Cards"

---

## Key Features to Verify

### Privacy & Security
- ✅ Links are encrypted in database
- ✅ Only group members can see shared links
- ✅ IP addresses and user agents are hashed in analytics
- ✅ Invite codes are unique per group

### User Experience
- ✅ Clear visual indicators for shared status
- ✅ Toast notifications for all actions
- ✅ Real-time updates when new links are shared
- ✅ Responsive design works on mobile

### Data Integrity
- ✅ Links can be shared with multiple groups
- ✅ Group deletion removes all shares
- ✅ User deletion cascades properly
- ✅ Click analytics track accurately

---

## API Endpoints Used in Workflow

| Action | Method | Endpoint | Body |
|--------|--------|----------|------|
| Create Group | POST | `/api/groups` | `{ name, description, type }` |
| Get Invite Code | GET | `/api/groups/:id` | - |
| Join Group | POST | `/api/groups/:groupId/invite` | `{ inviteCode }` |
| Create Link | POST | `/api/links` | `{ title, url, category, ... }` |
| Share Link | POST | `/api/shares` | `{ linkId, groupIds }` |
| Get Group Links | GET | `/api/groups/:id/links` | - |
| Track Click | POST | `/api/links/:id/click` | `{ userAgent, ipAddress }` |

---

## Database Verification Queries

After completing the workflow, verify data integrity:

```sql
-- Check group was created
SELECT * FROM groups WHERE name = 'Family Credit Cards';

-- Check both users are members
SELECT gm.*, u.email, u."firstName" 
FROM group_memberships gm 
JOIN users u ON gm."userId" = u.id
WHERE gm."groupId" = '<group-id>';

-- Check links were shared
SELECT s.*, l.title 
FROM shares s 
JOIN links l ON s."linkId" = l.id
WHERE s."targetType" = 'group' AND s."targetId" = '<group-id>';

-- Check click was recorded
SELECT * FROM click_events 
WHERE "linkId" = '<link-id>';

-- Check notifications were created
SELECT * FROM notifications 
WHERE "userId" = '<bob-user-id>' 
AND type = 'link_shared';
```

---

## Common Issues & Troubleshooting

### Issue: "Invalid invite code"
- **Cause**: Code expired or doesn't match
- **Fix**: Generate new invite code from group settings

### Issue: "Link not decrypting"
- **Cause**: ENCRYPTION_KEY environment variable missing
- **Fix**: Ensure `ENCRYPTION_KEY` is set in Replit Secrets

### Issue: "Group not appearing"
- **Cause**: Cache not invalidated after join
- **Fix**: Refresh page or clear React Query cache

### Issue: "Permission denied"
- **Cause**: User is not group member or owner
- **Fix**: Verify group membership in database

---

## Success Criteria

A successful end-to-end test should demonstrate:

1. ✅ Two users can create accounts independently
2. ✅ User A creates private group and generates invite code
3. ✅ User A creates referral links and shares them with group
4. ✅ User B joins group using invite code
5. ✅ User B can view and access all shared links
6. ✅ Analytics track when User B clicks links
7. ✅ Both users can see group member list
8. ✅ Notifications inform users of new shared links
9. ✅ Group owner can manage members and settings
10. ✅ All data is properly encrypted and secured

---

## Automated Testing Commands

```bash
# Run automated e2e tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- --grep "group sharing"

# Run with coverage
npm run test:e2e:coverage
```

---

## Next Steps

After successful testing:
1. Test with 5+ users in same group
2. Test concurrent link sharing
3. Test group deletion cascades
4. Test link expiration functionality
5. Load test with 1000+ links
6. Security audit of encryption
7. Mobile responsiveness testing
