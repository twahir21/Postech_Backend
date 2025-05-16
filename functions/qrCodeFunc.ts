import QRCode from "qrcode";
import sharp from "sharp";
import fs from "fs/promises";

export async function generateQRCodeWithLogo(data: string, logoPath: string, outputPath: string) {
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

        return {
            success: true,
            message: `QR Code generated successfully at path ${outputPath}`
        }
    } catch (error) {
        console.error("Error generating QR Code with Logo:", error);
        if (error instanceof Error) {
            return {
                success: false,
                message: error.message
            }
        }else{
            return {
                success: false,
                message: "Error while generating QR Code."
            }
        }
    }
}
