# 🎯 Test Scenario - Multi-User Group Sharing

## ✅ Scenario Successfully Created!

The complete test scenario from TESTING_GUIDE.md has been created in your database. You can now log in as either Alice or Bob to explore the multi-user group sharing functionality.

---

## 👥 Test Users

### 👤 Alice Smith (Group Owner)
- **Email**: `alice@example.com`
- **Password**: `SecurePass123!`
- **Role**: Group Owner
- **Created**: 3 referral links, 1 group

### 👤 Bob Johnson (Group Member)
- **Email**: `bob@example.com`
- **Password**: `SecurePass456!`
- **Role**: Group Member
- **Status**: Member of "Family Credit Cards" group

---

## 👥 Group Details

**Group Name**: Family Credit Cards  
**Type**: Family  
**Description**: Share premium credit card referral links with trusted family members  
**Owner**: Alice Smith  
**Members**: 2 (Alice as owner, Bob as member)  
**Invite Code**: `51a6e38244e7804503ef34b4af2b8388`

---

## 🔗 Shared Referral Links (3)

All three links are owned by Alice and shared with the "Family Credit Cards" group:

### 1. Chase Sapphire Preferred
- **Institution**: Chase
- **Category**: Credit Cards
- **Bonus Value**: $750 + 75,000 points
- **Notes**: Best travel rewards card - apply before March 2025
- **Status**: Shared with group ✅

### 2. American Express Platinum
- **Institution**: American Express
- **Category**: Credit Cards
- **Bonus Value**: 80,000 points
- **Notes**: Premium card with airport lounge access and travel credits
- **Status**: Shared with group ✅

### 3. Capital One Venture X
- **Institution**: Capital One
- **Category**: Credit Cards
- **Bonus Value**: 100,000 miles
- **Notes**: Great for travel with no foreign transaction fees
- **Status**: Shared with group ✅

---

## 🔔 Notifications

Bob has **3 unread notifications**:
- "Chase Sapphire Preferred was shared with your group"
- "American Express Platinum was shared with your group"
- "Capital One Venture X was shared with your group"

---

## 🎮 How to Explore the Scenario

### Option 1: Login as Alice (Group Owner)

1. **Navigate to**: `/login`
2. **Enter credentials**:
   - Email: `alice@example.com`
   - Password: `SecurePass123!`
3. **Click**: "Login" button

**What you'll see as Alice**:
- ✅ Dashboard showing your groups and links
- ✅ "Family Credit Cards" group in Groups page
- ✅ 3 referral links in Links page
- ✅ Each link marked as "Shared" with group indicator
- ✅ Group members list showing Alice (owner) and Bob (member)
- ✅ Ability to manage group settings and members
- ✅ Analytics showing if Bob has clicked any links

**Things you can try as Alice**:
- View group details and member list
- Edit group description
- Create new referral links
- Share additional links with the group
- View click analytics on your links
- Generate new invite codes
- Manage group members (remove Bob, change roles, etc.)

---

### Option 2: Login as Bob (Group Member)

1. **Navigate to**: `/login`
2. **Enter credentials**:
   - Email: `bob@example.com`
   - Password: `SecurePass456!`
3. **Click**: "Login" button

**What you'll see as Bob**:
- ✅ "Family Credit Cards" group in Groups page
- ✅ 3 notifications about new shared links
- ✅ Access to all 3 referral links shared by Alice
- ✅ Ability to view link details and copy referral URLs
- ✅ Analytics showing when you click links
- ✅ Your role shown as "member"

**Things you can try as Bob**:
- Click on notifications to view shared links
- Navigate to "Family Credit Cards" group
- View all shared links in the group
- Click on any link to view full details
- Copy referral URLs to use
- Create your own referral links
- Share your own links back to the group
- View other group members

---

## 🧪 Test Workflows to Try

### Workflow 1: Bob Views Shared Links
1. Login as Bob
2. Click "Groups" in sidebar
3. Click on "Family Credit Cards" group
4. See all 3 shared links from Alice
5. Click on "Chase Sapphire Preferred"
6. View link details including bonus value and notes
7. Copy the referral URL
8. **Expected**: URL is decrypted and ready to use

### Workflow 2: Alice Monitors Group Activity
1. Login as Alice
2. Navigate to Groups → "Family Credit Cards"
3. Click "Members" tab
4. See both Alice (owner) and Bob (member)
5. Navigate to Links → "Chase Sapphire Preferred"
6. View analytics/stats
7. **Expected**: See if Bob has clicked the link

### Workflow 3: Bob Creates and Shares Link
1. Login as Bob
2. Navigate to Links page
3. Click "Create Link"
4. Fill in:
   - Title: "Discover It Cash Back"
   - URL: "https://discover.com/refer/bob123"
   - Category: "Credit Cards"
   - Institution: "Discover"
   - Bonus Value: "$150 cashback"
5. After creating, click "Share"
6. Select "Family Credit Cards" group
7. **Expected**: Alice receives notification about Bob's shared link

### Workflow 4: Alice Manages Group
1. Login as Alice
2. Navigate to Groups → "Family Credit Cards"
3. Click "Edit" button
4. Update description
5. Save changes
6. **Expected**: Bob sees updated description when viewing group

### Workflow 5: Test Group Invite Code
1. Logout from all accounts
2. Create a new test account (your own email)
3. After signup, navigate to Groups
4. Click "Join Group"
5. Enter invite code: `51a6e38244e7804503ef34b4af2b8388`
6. **Expected**: Successfully join "Family Credit Cards" and see all 3 shared links

---

## 📊 Database Verification

The following data has been created:

```sql
-- Users created: 2
SELECT email, first_name, last_name FROM users 
WHERE email IN ('alice@example.com', 'bob@example.com');

-- Group created: 1
SELECT name, type, invite_code FROM groups 
WHERE name = 'Family Credit Cards';

-- Group memberships: 2
SELECT u.email, gm.role FROM group_memberships gm
JOIN users u ON gm.user_id = u.id
WHERE gm.group_id = (SELECT id FROM groups WHERE name = 'Family Credit Cards');

-- Links created: 3
SELECT title, institution, bonus_value FROM links
WHERE owner_id = (SELECT id FROM users WHERE email = 'alice@example.com');

-- Shares created: 3
SELECT l.title, s.target_type FROM shares s
JOIN links l ON s.link_id = l.id
WHERE s.target_type = 'group';

-- Notifications created: 3
SELECT title, message FROM notifications
WHERE user_id = (SELECT id FROM users WHERE email = 'bob@example.com');
```

---

## 🔒 Security Features Demonstrated

1. **Encrypted Links**: All referral URLs are encrypted in the database using AES-256-GCM
2. **Password Security**: User passwords are hashed with Argon2
3. **Private Groups**: Links are only visible to group members
4. **Invite Codes**: Secure group joining via unique invite codes
5. **Role-Based Access**: Owner vs member permissions
6. **Privacy**: Only group members can see shared links

---

## 🐛 Troubleshooting

### Cannot login?
- Make sure you're using the exact email and password
- Alice: `alice@example.com` / `SecurePass123!`
- Bob: `bob@example.com` / `SecurePass456!`

### Not seeing the group?
- Click "Groups" in the sidebar
- The group name is "Family Credit Cards"
- Refresh the page if needed

### Links not decrypting?
- Ensure `ENCRYPTION_KEY` environment variable is set
- Check browser console for errors

### Need to reset the scenario?
- Run the script again: `npx tsx scripts/create-test-scenario.ts`
- It will create new users with the same emails (or update existing ones)

---

## 📝 Next Steps

After exploring the test scenario, you can:

1. **Extend the scenario**: Add more users, groups, and links
2. **Test edge cases**: Remove members, delete groups, archive links
3. **Add real data**: Create your own groups and referral links
4. **Invite real users**: Share your group invite codes
5. **Monitor analytics**: Track clicks and engagement
6. **Customize**: Update group settings, link categories, etc.

---

## 🎉 Summary

You now have a fully functional multi-user group sharing scenario with:
- ✅ 2 test users (Alice and Bob)
- ✅ 1 private group ("Family Credit Cards")
- ✅ 3 shared referral links
- ✅ 3 notifications for Bob
- ✅ All security features enabled
- ✅ Ready to explore and test!

**Start exploring**: Go to `/login` and login as Alice or Bob!
