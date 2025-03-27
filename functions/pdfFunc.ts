import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';
import axios from 'axios';

interface QRCode {
  url: string;
  productName: string;
}

async function generateQRCodePDF(qrCodes: QRCode[]): Promise<void> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Loop through the QR codes and add them to the PDF
  for (let i = 0; i < qrCodes.length; i++) {
    const qrCode = qrCodes[i];
    const qrCodeUrl = qrCode.url; // URL of the QR code
    const productName = qrCode.productName; // Text to identify the product

    // Download the QR code image
    const qrImageBytes = await axios.get(qrCodeUrl, { responseType: 'arraybuffer' }).then(res => res.data);
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    // Add a page and draw the QR code image
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const qrCodeWidth = 100;
    const qrCodeHeight = 100;

    // Draw the QR code on the page
    page.drawImage(qrImage, {
      x: width / 2 - qrCodeWidth / 2,
      y: height - qrCodeHeight - 50,
      width: qrCodeWidth,
      height: qrCodeHeight,
    });

    // Add product name below QR code
    page.drawText(productName, {
      x: width / 2 - (productName.length * 5) / 2, // Centering the text
      y: height - qrCodeHeight - 70,
      size: 12,
      color: rgb(0, 0, 0),
    });
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();

  // Write the PDF to a file
  fs.writeFileSync('./pdf/qr_codes.pdf', pdfBytes);
  console.log('PDF saved as qr_codes.pdf');
}

// Example QR codes data
const qrCodes: QRCode[] = [
  {
    url: "https://api005.backblazeb2.com/file/postech/qrcode_fef51c70-5874-4ef5-93e5-84888aeebcc4_59a75ef2-9a27-40c1-a7d5-c9c863d2d470.png?Authorization=3_20250327134220_ca40513bd2eda5f964892950_7c20669950269bb15b7fcfdfff65001f6b61ca1e_005_20250327134720_0084_dnld",
    productName: "Product 1"
  },
  {
    url: "https://api005.backblazeb2.com/file/postech/qrcode_fef51c70-5874-4ef5-93e5-84888aeebcc4_59a75ef2-9a27-40c1-a7d5-c9c863d2d470.png?Authorization=3_20250327134220_ca40513bd2eda5f964892950_7c20669950269bb15b7fcfdfff65001f6b61ca1e_005_20250327134720_0084_dnld",
    productName: "Product 2"
  }
];

// Generate PDF with the QR codes and text
generateQRCodePDF(qrCodes);
