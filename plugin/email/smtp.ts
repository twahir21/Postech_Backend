import nodemailer from "nodemailer";
import "dotenv/config";
import { Elysia } from "elysia";
import { z } from "zod";
import { sanitizeString } from "../../functions/security/xss";

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", 
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PSWD,
    },
});

export const mailPlugin = new Elysia();

interface email {
    name?: string;
    email?: string;
    message?: string;
}

mailPlugin.post("/sendMail", async ({ body }: { body: email }) => {
    try {
        const parsed = z.object({
            name: z.string().min(3, "Jina haliwezi kuwa na herufi chini ya tatu"),
            email: z.string().email(),
            message: z.string().max(1000, "Ujumbe wako ni mkubwa sana").min(5)
        });

        const safeParsed = parsed.safeParse(body);

        if (!safeParsed.success) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: "Jina haliwezi kuwa na herufi chini ya tatu au ujumbe wako ni zaidi ya herufi 1000 au chini ya 5",
                }),
                { status: 400 }
            );
        }

        let { name, email, message } = safeParsed.data;

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
            from: `"${name}" <${email}>`,
            to: process.env.TO_EMAIL,
            subject: "New Contact Message",
            text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
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
});
