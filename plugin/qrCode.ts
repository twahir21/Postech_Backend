import Elysia from "elysia";
import jwt from "@elysiajs/jwt";
import fs from "fs/promises"; // Use async file handling
import AdmZip from "adm-zip"; // For creating zip files
import dotenv from "dotenv";
import { extractId } from "../functions/security/jwtToken";
import { generateQRCodeWithLogo } from "../functions/qrCodeFunc";
import { mainDb } from "../database/schema/connections/mainDb";
import { products, purchases, shops, supplierPriceHistory } from "../database/schema/shop";
import { eq } from "drizzle-orm";

dotenv.config();

const {
  JWT_TOKEN,
} = process.env;

if (!JWT_TOKEN) {
  throw new Error("Missing required environment variables!");
}

// 🚀 QR Code API Route
const qrCodePlugin = new Elysia()
  .use(jwt({ name: "jwt", secret: JWT_TOKEN }))
  .get("/check-isQrCode", async ({ jwt, cookie }) => {
    try {
      const { userId, shopId } = await extractId({ jwt, cookie });

      // Fetch all products where isQRCode is false
      const productList = await mainDb
        .select({
          id: products.id,
          name: products.name,
          priceSold: products.priceSold,
        })
        .from(products)
        .where(eq(products.isQRCode, false));

      // Return early if no products require QR code generation
      if (productList.length === 0) {
        return { success: false, message: "No products require QR code generation." };
      }

      return { success: true, message: "Products found for QR code generation." };
      
    } catch (error) {
      console.error("Error checking QR code status:", error);
      return { success: false, message: "An error occurred while checking QR code status." };
    }
  })
  .get("/generate-qrcode", async ({ jwt, cookie, set }) => {
    try {
      const { userId, shopId } = await extractId({ jwt, cookie });

      // Fetch all products where isQRCode is false
      const productList = await mainDb
        .select({
          id: products.id,
          name: products.name,
          priceSold: products.priceSold,
          supplierId: products.supplierId
        })
        .from(products)
        .where(eq(products.isQRCode, false));


      const shopName = await mainDb
        .select({ name: shops.name })
        .from(shops)
        .where(eq(shops.id, shopId))
        .then((res) => res[0]?.name);

      if (!shopName) {  
        return { success: false, message: "Shop not found." };
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

        // Generate a filename using shopName and productName
        const sanitizedShopName = shopName.replace(/[^a-zA-Z0-9-_]/g, "_"); // Sanitize shopName
        const sanitizedName = product.name.replace(/[^a-zA-Z0-9-_]/g, "_"); // Sanitize productName
        const fileName = `qrcode_${sanitizedShopName}_${sanitizedName}.png`;
        const outputPath = `./images/${fileName}`;

        const prodData = {
          product: {
            productId: product.id,
            priceSold: product.priceSold,
            supplierId: product.supplierId,
            name: product.name,
            quantity: 1,
            saleType: "cash",
            discount: 0,
            customerId: null,
            description: "home Expenses",
            priceBought,
            generatedAt: new Date().toISOString(),
          },
        };

        const url = new URL("http://localhost:5173/scan-qrcode");

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
        tempFiles.push(outputPath);

        // Delete local QR file
        await fs.unlink(outputPath).catch((err) => console.error("File delete error:", err));
      }

      // Save the zip file
      const zipFileName = `qrcodes_${Date.now()}.zip`;
      const zipFilePath = `./${zipFileName}`;
      zip.writeZip(zipFilePath);

      // Update isQRCode flag in the database
      await mainDb
        .update(products)
        .set({ isQRCode: true })
        .where(eq(products.isQRCode, false));

      // Return the zip file as a downloadable response
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