// utils/checksum.ts
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";


export const createPayloadChecksum = async (
    checksumKey: string,
    payload: Record<string, string | number>
  ): Promise<string> => {
    // Step 1: Sort payload keys alphabetically
    const sortedPayload = Object.keys(payload)
      .sort()
      .reduce((acc: Record<string, string | number>, key) => {
        acc[key] = payload[key];
        return acc;
      }, {});
  
    // Step 2: Create a single string from the values
    const payloadString = Object.values(sortedPayload).join("");
  
    // Step 3: Encode key and data
    const encoder = new TextEncoder();
    const keyData = encoder.encode(checksumKey);
    const data = encoder.encode(payloadString);
  
    // Step 4: Import key
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
  
    // Step 5: Generate HMAC signature
    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };
  
  export const validateChecksum = async (
    checksumKey: string,
    payload: Record<string, string | number>,
    receivedChecksum: string
  ): Promise<boolean> => {
    const computed = await createPayloadChecksum(checksumKey, payload);
    return computed === receivedChecksum;
  };
  
//   const payload = { amount: 100, currency: "USD", reference: "TX123" };
// const checksumKey = "secret-key";

// // ✅ Create
// const checksum = await createPayloadChecksum(checksumKey, payload);
// console.log("Generated Checksum:", checksum);

// // ✅ Validate
// const isValid = await validateChecksum(checksumKey, payload, checksum);
// console.log("Checksum is", isValid ? "Valid ✅" : "Invalid ❌");

export const generateOrderRef = () => {
    const prefix = "ORD";
    const timestamp = Date.now().toString(36).toUpperCase(); // time in base36
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${timestamp}${random}`;
  };
  
  // Example:
//   console.log(generateOrderRef()); // ORDKX1F4D9G7V3Z
const ENCRYPTION_KEY = process.env.CLICKPESA_ENCRYPT; // Exactly 32 characters

if(!ENCRYPTION_KEY) throw new Error ("encryption key is not available")

const key = Buffer.from(ENCRYPTION_KEY, "base64"); // 32 bytes

export const encrypt = (data: string): string => {
  const iv = randomBytes(12); // 96 bits for AES-GCM
  const cipher = createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([cipher.update(data, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
};

export const decrypt = (encryptedData: string): string => {
  const buffer = Buffer.from(encryptedData, "base64");

  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
};


// const gatewayToken = "sk_live_xxx";
// const encrypted = encrypt(gatewayToken);
// Save `encrypted` to DB
// Later, to retrieve:
// const decrypted = decrypt(encrypted);
// console.log(decrypted); // "sk_live_xxx"
