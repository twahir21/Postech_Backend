import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import axios from "axios";
import fs from "fs/promises"; // Use async file handling
import AdmZip from "adm-zip"; // For creating zip files
import dotenv from "dotenv";
import { extractId } from "../functions/security/jwtToken";
import { generateQRCodeWithLogo } from "../functions/qrCodeFunc";
import { mainDb } from "../database/schema/connections/mainDb";
import { products, purchases, supplierPriceHistory } from "../database/schema/shop";
import { eq } from "drizzle-orm";

dotenv.config();

const {
  JWT_TOKEN,
  B2_KEY_ID,
  B2_APPLICATION_KEY,
  B2_BUCKET_ID,
  B2_BUCKET_NAME,
} = process.env;

if (!JWT_TOKEN || !B2_KEY_ID || !B2_APPLICATION_KEY || !B2_BUCKET_ID || !B2_BUCKET_NAME) {
  throw new Error("Missing required environment variables!");
}

// 🔥 Cache B2 Authentication & Upload URL
let b2AuthCache: { apiUrl: string; authToken: string; uploadUrl: string; uploadAuthToken: string } | null = null;
let lastAuthTime = 0;

// 🛠️ Authenticate with B2 (Caching Enabled)
async function getB2Auth() {
  const now = Date.now();
  if (b2AuthCache && now - lastAuthTime < 23 * 60 * 60 * 1000) {
    return b2AuthCache;
  }

  console.log("🔐 Authenticating with B2...");
  const authString = Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString("base64");
  const response = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: { Authorization: `Basic ${authString}` },
  });

  const uploadResponse = await axios.post(
    `${response.data.apiUrl}/b2api/v2/b2_get_upload_url`,
    { bucketId: B2_BUCKET_ID },
    { headers: { Authorization: response.data.authorizationToken } }
  );

  b2AuthCache = {
    apiUrl: response.data.apiUrl,
    authToken: response.data.authorizationToken,
    uploadUrl: uploadResponse.data.uploadUrl,
    uploadAuthToken: uploadResponse.data.authorizationToken,
  };

  lastAuthTime = now;
  return b2AuthCache;
}

// 🔄 Upload QR code to Backblaze B2
async function uploadToB2(filePath: string, fileName: string) {
  const { uploadUrl, uploadAuthToken } = await getB2Auth();
  const fileBuffer = await fs.readFile(filePath);

  await axios.post(uploadUrl, fileBuffer, {
    headers: {
      Authorization: uploadAuthToken,
      "X-Bz-File-Name": fileName,
      "Content-Type": "image/png",
      "X-Bz-Content-Sha1": "do_not_verify",
    },
  });

  return fileName;
}

// 🔗 Generate a private download link
async function getPrivateDownloadUrl(fileName: string) {
  const { apiUrl, authToken } = await getB2Auth();

  const response = await axios.post(
    `${apiUrl}/b2api/v2/b2_get_download_authorization`,
    {
      bucketId: B2_BUCKET_ID,
      fileNamePrefix: fileName,
      validDurationInSeconds: 300,
    },
    { headers: { Authorization: authToken } }
  );

  return `${apiUrl}/file/${B2_BUCKET_NAME}/${fileName}?Authorization=${response.data.authorizationToken}`;
}

// 🚀 QR Code API Route
const qrCodePlugin = new Elysia()
  .use(jwt({ name: "jwt", secret: JWT_TOKEN }))
  .get("/generate-qrcode", async ({ set }) => {
    try {
      // Step 1: Fetch all products where isQRCode is false
      const productList = await mainDb
        .select({
          id: products.id,
          name: products.name,
          priceSold: products.priceSold,
        })
        .from(products)
        .where(eq(products.isQRCode, false));

      if (productList.length === 0) {
        return { success: true, message: "No products require QR code generation." };
      }

      const zip = new AdmZip(); // Create a new zip archive
      const tempFiles: string[] = []; // Track temporary files for cleanup

      // Process each product
      for (const product of productList) {
        const res = await mainDb
          .select({ price: supplierPriceHistory.price })
          .from(supplierPriceHistory)
          .where(eq(supplierPriceHistory.productId, product.id));

        const amount = res[0]?.price;

        const priceBoughtDb = await mainDb
          .select({ priceBought: purchases.priceBought })
          .from(purchases)
          .where(eq(purchases.productId, product.id));

        const priceBought = priceBoughtDb[0]?.priceBought;

        const logoPath = process.env.QR_LOGO_PATH || "./default_logo.png";
        const outputPath = `./images/qrcode_${product.id}.png`;
        const fileName = `qrcode_${product.id}.png`;

        const prodData = {
          product: {
            productId: product.id,
            priceSold: product.priceSold,
            name: product.name,
            quantity: 1,
            saleType: "cash",
            discount: 0,
            customerId: null,
            description: "home Expenses",
            amount,
            priceBought,
            generatedAt: new Date().toISOString(),
          },
        };

        const url = new URL("http://localhost:3000/scan-qrcode");

        Object.keys(prodData.product).forEach((key) => {
          const value = prodData.product[key as keyof typeof prodData.product];
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, value.toString());
          }
        });

        const data = url.toString();

        // Generate QR code
        await generateQRCodeWithLogo(data, logoPath, outputPath);

        // Add QR code image to the zip archive
        zip.addLocalFile(outputPath, "", fileName); // Add file to root of zip
        tempFiles.push(outputPath); // Track file for cleanup

        // Delete local QR file after adding to zip
        await fs.unlink(outputPath).catch((err) => console.error("File delete error:", err));
      }

      // Step 2: Save the zip file
      const zipFileName = `qrcodes_${Date.now()}.zip`;
      const zipFilePath = `./${zipFileName}`;
      zip.writeZip(zipFilePath);

      // Step 3: Update isQRCode flag in the database
      await mainDb
        .update(products)
        .set({ isQRCode: true })
        .where(eq(products.isQRCode, false));

      // Step 4: Return the zip file as a downloadable response
      const zipFileBuffer = await fs.readFile(zipFilePath);

      // Clean up temporary zip file
      await fs.unlink(zipFilePath).catch((err) => console.error("Zip file delete error:", err));

      // Set headers for auto-download
      set.headers["Content-Type"] = "application/zip";
      set.headers["Content-Disposition"] = `attachment; filename="${zipFileName}"`;

      return zipFileBuffer;
    } catch (error) {
      console.error("Error generating QR codes:", error);
      return { success: false, message: "An error occurred during QR code generation." };
    }
  });

export default qrCodePlugin;