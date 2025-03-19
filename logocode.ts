import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs/promises";

async function generateQRCodeWithLogo(data: string, logoPath: string, outputPath: string) {
    try {
        const qrSize = 500; // QR Code Size (Increase for better quality)
        const logoScale = 0.25; // Logo should be 25% of the QR code

        // Generate QR Code as a Buffer
        const qrCodeBuffer = await QRCode.toBuffer(data, {
            errorCorrectionLevel: "H", // High to allow logo overlay
            width: qrSize,
        });

        // Load & Resize Logo (25% of QR size)
        const logoSize = Math.floor(qrSize * logoScale);
        const logoBuffer = await fs.readFile(logoPath);
        const resizedLogo = await sharp(logoBuffer)
            .resize(logoSize, logoSize)
            .toBuffer();

        // Overlay Logo in the Center
        await sharp(qrCodeBuffer)
            .composite([{ input: resizedLogo, gravity: "center" }]) // Centered logo
            .toFile(outputPath);

        console.log("QR Code with Logo saved at:", outputPath);
    } catch (error) {
        console.error("Error generating QR Code with Logo:", error);
    }
}


const productData = {
    product: {
      id: "PROD001",
      name: "Thermal Receipt Printer",
      company: "Postech Innovations",
      price_sold: 12000,
      price_bought: 10000,
      created_at: "2025-03-18T10:30:00Z",
      supplier: {
        name: "Tech Supplies Ltd",
        contact: "+254700123456"
      }
    }
  };
  
  const jsonString = JSON.stringify(productData);
  

// Example Usage
const data = jsonString
const logoPath = "./logo.png"; // Ensure the logo file exists
const outputPath = "./qrcode_with_logo.png";

generateQRCodeWithLogo(data, logoPath, outputPath);
