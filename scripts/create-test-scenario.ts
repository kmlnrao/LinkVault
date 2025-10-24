import { db } from "../server/db";
import { users, groups, groupMemberships, links, shares, notifications } from "../shared/schema";
import { encrypt, generateInviteCode, generateShareToken } from "../server/lib/encryption";
import argon2 from "argon2";
import crypto from "crypto";

async function createTestScenario() {
  console.log("🚀 Creating test scenario from TESTING_GUIDE.md...\n");

  // Step 1: Create Alice
  console.log("1️⃣ Creating Alice...");
  const alicePassword = await argon2.hash("SecurePass123!");
  const aliceId = crypto.randomUUID();
  
  const [alice] = await db.insert(users).values({
    id: aliceId,
    email: "alice@example.com",
    passwordHash: alicePassword,
    firstName: "Alice",
    lastName: "Smith",
    emailVerified: true,
  }).returning();
  
  console.log(`   ✅ Alice created: ${alice.email} (ID: ${alice.id})`);
  console.log(`   🔑 Password: SecurePass123!\n`);

  // Step 2: Create Bob
  console.log("2️⃣ Creating Bob...");
  const bobPassword = await argon2.hash("SecurePass456!");
  const bobId = crypto.randomUUID();
  
  const [bob] = await db.insert(users).values({
    id: bobId,
    email: "bob@example.com",
    passwordHash: bobPassword,
    firstName: "Bob",
    lastName: "Johnson",
    emailVerified: true,
  }).returning();
  
  console.log(`   ✅ Bob created: ${bob.email} (ID: ${bob.id})`);
  console.log(`   🔑 Password: SecurePass456!\n`);

  // Step 3: Create "Family Credit Cards" group for Alice
  console.log("3️⃣ Creating 'Family Credit Cards' group...");
  const inviteCode = generateInviteCode();
  const groupId = crypto.randomUUID();
  
  const [group] = await db.insert(groups).values({
    id: groupId,
    ownerId: alice.id,
    name: "Family Credit Cards",
    description: "Share premium credit card referral links with trusted family members",
    type: "family",
    inviteCode: inviteCode,
  }).returning();
  
  console.log(`   ✅ Group created: ${group.name}`);
  console.log(`   🎫 Invite Code: ${group.inviteCode}\n`);

  // Step 4: Add Alice as group owner
  console.log("4️⃣ Adding Alice as group owner...");
  await db.insert(groupMemberships).values({
    id: crypto.randomUUID(),
    groupId: group.id,
    userId: alice.id,
    role: "owner",
  });
  console.log(`   ✅ Alice added as owner\n`);

  // Step 5: Create referral links for Alice
  console.log("5️⃣ Creating referral links for Alice...");
  
  // Link 1: Chase Sapphire Preferred
  const link1Id = crypto.randomUUID();
  const link1Url = encrypt("https://www.chase.com/referral/alice123");
  const link1Notes = encrypt("Best travel rewards card - apply before March 2025");
  
  const [link1] = await db.insert(links).values({
    id: link1Id,
    ownerId: alice.id,
    title: "Chase Sapphire Preferred",
    urlEncrypted: link1Url,
    category: "Credit Cards",
    institution: "Chase",
    bonusValue: "$750 + 75,000 points",
    notesEncrypted: link1Notes,
    visibility: "private",
  }).returning();
  
  console.log(`   ✅ Link 1: ${link1.title}`);

  // Link 2: American Express Platinum
  const link2Id = crypto.randomUUID();
  const link2Url = encrypt("https://www.americanexpress.com/refer/alice456");
  const link2Notes = encrypt("Premium card with airport lounge access and travel credits");
  
  const [link2] = await db.insert(links).values({
    id: link2Id,
    ownerId: alice.id,
    title: "American Express Platinum",
    urlEncrypted: link2Url,
    category: "Credit Cards",
    institution: "American Express",
    bonusValue: "80,000 points",
    notesEncrypted: link2Notes,
    visibility: "private",
  }).returning();
  
  console.log(`   ✅ Link 2: ${link2.title}`);

  // Link 3: Capital One Venture X
  const link3Id = crypto.randomUUID();
  const link3Url = encrypt("https://capital1.com/refer/alice789");
  const link3Notes = encrypt("Great for travel with no foreign transaction fees");
  
  const [link3] = await db.insert(links).values({
    id: link3Id,
    ownerId: alice.id,
    title: "Capital One Venture X",
    urlEncrypted: link3Url,
    category: "Credit Cards",
    institution: "Capital One",
    bonusValue: "100,000 miles",
    notesEncrypted: link3Notes,
    visibility: "private",
  }).returning();
  
  console.log(`   ✅ Link 3: ${link3.title}\n`);

  // Step 6: Share all links with the group
  console.log("6️⃣ Sharing links with 'Family Credit Cards' group...");
  
  for (const link of [link1, link2, link3]) {
    await db.insert(shares).values({
      id: crypto.randomUUID(),
      linkId: link.id,
      sharedById: alice.id,
      targetType: "group",
      targetId: group.id,
      shareToken: generateShareToken(),
    });
    console.log(`   ✅ ${link.title} shared with group`);
  }
  console.log("");

  // Step 7: Add Bob to the group
  console.log("7️⃣ Adding Bob to the group...");
  await db.insert(groupMemberships).values({
    id: crypto.randomUUID(),
    groupId: group.id,
    userId: bob.id,
    role: "member",
  });
  console.log(`   ✅ Bob added as member\n`);

  // Step 8: Create notifications for Bob
  console.log("8️⃣ Creating notifications for Bob...");
  
  for (const link of [link1, link2, link3]) {
    await db.insert(notifications).values({
      id: crypto.randomUUID(),
      userId: bob.id,
      type: "link_shared",
      title: "New link shared",
      message: `${link.title} was shared with your group`,
      linkId: link.id,
      groupId: group.id,
      isRead: false,
    });
    console.log(`   ✅ Notification created for ${link.title}`);
  }
  console.log("");

  // Summary
  console.log("═══════════════════════════════════════════════════════════");
  console.log("✨ Test Scenario Created Successfully! ✨");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  console.log("📋 SCENARIO SUMMARY:\n");
  console.log("👤 Alice (Group Owner)");
  console.log(`   Email: ${alice.email}`);
  console.log(`   Password: SecurePass123!`);
  console.log(`   ID: ${alice.id}\n`);
  
  console.log("👤 Bob (Group Member)");
  console.log(`   Email: ${bob.email}`);
  console.log(`   Password: SecurePass456!`);
  console.log(`   ID: ${bob.id}\n`);
  
  console.log("👥 Group: Family Credit Cards");
  console.log(`   Description: ${group.description}`);
  console.log(`   Type: ${group.type}`);
  console.log(`   Invite Code: ${group.inviteCode}`);
  console.log(`   Members: 2 (Alice as owner, Bob as member)\n`);
  
  console.log("🔗 Shared Links (3):");
  console.log(`   1. ${link1.title} - ${link1.bonusValue}`);
  console.log(`   2. ${link2.title} - ${link2.bonusValue}`);
  console.log(`   3. ${link3.title} - ${link3.bonusValue}\n`);
  
  console.log("🔔 Notifications: 3 notifications created for Bob\n");
  
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🎯 WHAT TO DO NEXT:");
  console.log("═══════════════════════════════════════════════════════════\n");
  
  console.log("Option 1: Login as Alice");
  console.log("  1. Go to /login");
  console.log("  2. Email: alice@example.com");
  console.log("  3. Password: SecurePass123!");
  console.log("  4. Navigate to Groups → Family Credit Cards");
  console.log("  5. See your 3 shared links");
  console.log("  6. View group members (Alice & Bob)\n");
  
  console.log("Option 2: Login as Bob");
  console.log("  1. Go to /login");
  console.log("  2. Email: bob@example.com");
  console.log("  3. Password: SecurePass456!");
  console.log("  4. Navigate to Groups → Family Credit Cards");
  console.log("  5. See Alice's 3 shared links");
  console.log("  6. Check notifications (3 new notifications)");
  console.log("  7. Click on any link to view details and copy referral URL\n");
  
  console.log("═══════════════════════════════════════════════════════════\n");

  process.exit(0);
}

createTestScenario().catch((error) => {
  console.error("❌ Error creating test scenario:", error);
  process.exit(1);
});
