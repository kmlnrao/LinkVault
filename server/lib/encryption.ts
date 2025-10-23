import crypto from "crypto";

// Simple encryption for demo purposes
// In production, use a proper KMS or encryption service
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "demo-key-32-chars-long-please!";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(text: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv + authTag + encrypted
    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    // Fallback to base64 encoding if encryption fails
    return Buffer.from(text).toString("base64");
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const parts = encryptedText.split(":");
    
    // Handle fallback base64 encoding
    if (parts.length !== 3) {
      return Buffer.from(encryptedText, "base64").toString("utf8");
    }
    
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];
    
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    // Try fallback base64 decoding
    try {
      return Buffer.from(encryptedText, "base64").toString("utf8");
    } catch {
      return encryptedText;
    }
  }
}

export function generateInviteCode(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateShareToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}

export function hashUserAgent(userAgent: string): string {
  return crypto.createHash("sha256").update(userAgent).digest("hex");
}
