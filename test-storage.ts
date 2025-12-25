// test-storage.ts
import { storage } from "@/lib/storage";

console.log("🚀 Testing storage wrapper...");

// Try getting a token (should be null on first run)
const existingToken = storage.get("token");
console.log("Existing token:", existingToken);

// Set a new token
storage.set("token", "abc123");
console.log("Token set to 'abc123'");

// Get the token back
const tokenAfterSet = storage.get("token");
console.log("Token after set:", tokenAfterSet);

// Remove the token
storage.remove("token");
console.log("Token removed");

// Verify removal
const tokenAfterRemove = storage.get("token");
console.log("Token after removal:", tokenAfterRemove);

console.log("✅ Storage test completed!");
