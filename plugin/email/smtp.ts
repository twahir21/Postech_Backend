import nodemailer from "nodemailer";
import "dotenv/config";
import { Elysia } from "elysia";
import { sanitizeString } from "../../functions/security/xss";
import { emailData } from "../../functions/security/validators/data";

const zohoEmail = "huduma@mypostech.store";

let transporter = nodemailer.createTransport({
    host: "smtp.zoho.com", 
    port: 465, // Use 465 for SSL or 587 for TLS
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
        user: zohoEmail,
        pass: process.env.ZOHO_APP_PASSWORD,
    },
});

export const mailPlugin = new Elysia();

interface email {
    name: string;
    email: string;
    message: string;
}

mailPlugin.post("/sendMail", async ({ body }: { body: email }) => {
    try {
        let { name, email, message } = body as email;

        name = sanitizeString(name);
        email = sanitizeString(email);
        message = sanitizeString(message);

        if (!name || !email || !message) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Sehemu zote zinahitajika",
                }),
                { status: 400 }
            );
        }

        await transporter.sendMail({
            from: `"${name}" <${zohoEmail}>`,
            to: process.env.TO_EMAIL,
            subject: "PosTech message",
            html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message}</p>`,
        });

        return new Response(
            JSON.stringify({
                success: true,
                message: "Ujumbe wako umetumwa kiukamilifu!",
            }),
            { status: 200 }
        );
    } catch (error) {
        console.error("Email Error:", error);
        return new Response(
            JSON.stringify({
                success: false,
                error: "Imeshindwa kutuma barua pepe",
            }),
            { status: 500 }
        );
    }
}, {
    body: emailData
});
