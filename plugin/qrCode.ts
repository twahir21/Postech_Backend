import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import axios from "axios";
import fs from "fs/promises"; // Use async file handling
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
    B2_BUCKET_NAME 
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
    if (b2AuthCache && now - lastAuthTime < 23 * 60 * 60 * 1000) { // Cache valid for 23 hours
        return b2AuthCache;
    }

    console.log("🔐 Authenticating with B2...");
    const authString = Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString("base64");
    const response = await axios.get("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
        headers: { Authorization: `Basic ${authString}` },
    });

    // Get upload URL
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
    .get("/generate-qrcode", async ({ query, jwt, cookie }) => {
        try {
            const { userId, shopId } = await extractId({ jwt, cookie });
            const { productId } = query;

            const result = await mainDb.select({priceSold: products.priceSold})
                                .from(products).where(eq(products.id, productId));
            
            const priceSold = result[0]?.priceSold;

            const res = await mainDb.select({ price: supplierPriceHistory.price })
                                .from(supplierPriceHistory).where(eq(supplierPriceHistory.productId, productId));
            
            const amount = res[0]?.price;

            const priceBoughtDb = await mainDb.select({ priceBought: purchases.priceBought })
                                    .from(purchases).where(eq(purchases.productId, productId));

            const priceBought = priceBoughtDb[0]?.priceBought;

            const logoPath = process.env.QR_LOGO_PATH || "./default_logo.png";
        
            const outputPath = `./images/qrcode_${shopId}_${productId}.png`;
            const fileName = `qrcode_${shopId}_${productId}.png`;

            const prodData = {
                product: {
                    shopId,
                    productId,
                    priceSold,
                    userId,
                    quantity: 1,
                    saleType: "cash",
                    discount: 0,
                    customerId: null,
                    description: "purchases",
                    amount,
                    priceBought
                },
            };

            const url = new URL('http://localhost:3000/scan-qrcode');

            // Iterate over the product object keys and append them as query params
            Object.keys(prodData.product).forEach((key) => {
                const value = prodData.product[key as keyof typeof prodData.product];
                if (value !== undefined && value !== null) {  // ✅ Ensure value exists
                    url.searchParams.append(key, value.toString());
                }
            });            
            
            const data = url.toString();
            console.time("QR Code Generation");

            // 🏎️ Generate QR Code in the background
            const qrPromise = generateQRCodeWithLogo(data, logoPath, outputPath);

            // 🌍 Get B2 Authentication in parallel
            const authPromise = getB2Auth();

            // Wait for both QR code generation and B2 auth to complete
            await Promise.all([qrPromise, authPromise]);

            console.timeEnd("QR Code Generation");

            console.time("B2 Upload");
            // 🏎️ Upload QR code asynchronously
            await uploadToB2(outputPath, fileName);
            console.timeEnd("B2 Upload");

            // 🗑️ Delete the local QR file asynchronously
            await fs.unlink(outputPath).catch(err => console.error("File delete error:", err));

            console.time("Get Signed URL");
            // 🔗 Generate a signed URL for download
            const secureUrl = await getPrivateDownloadUrl(fileName);
            console.timeEnd("Get Signed URL");

            return { success: true, url: secureUrl };
        } catch (error) {
            console.error("Error generating QR code:", error);
            return { success: false, message: "An error occurred during QR code generation." };
        }
    });

export default qrCodePlugin;
