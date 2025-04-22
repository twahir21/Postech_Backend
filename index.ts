import Elysia from "elysia";
import homePlugin from "./plugin/home";
import qrCodePlugin from "./plugin/qrCode";
import regPlugin from "./plugin/registration";
import { setupI18n } from "./functions/translation";
import { cors } from "@elysiajs/cors";

import fs from "fs";
import path from "path";
import categoriesPlugin from "./plugin/categories";
import suppPlugin from "./plugin/supplier";
import { rateLimitMiddleware } from "./functions/security/rateLimiting";
import { loginPlugin } from "./plugin/login";
import { prodPlugin } from "./plugin/products";
import automateTasks from "./plugin/autoSales";
import { mailPlugin } from "./plugin/email/smtp";
import cookie from "@elysiajs/cookie";
import { CustomersPlugin } from "./plugin/customer";
import analyticsRoute from "./plugin/analytics";
import { authPlugin } from "./plugin/authPlugin";

const startTime = Date.now(); // Start time tracking


// initialize translation before start the server
await setupI18n();
new Elysia()
    // use cookie for JWT
    .use(cookie())

    // Proper CORS handling
    .use(
        cors({
            origin: ["https://www.mypostech.store", "https://qwik.mypostech.store"], // Allow only frontend origin
            allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
            credentials: true, // Allow cookies
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow specific methods
            maxAge: 3600, // Cache preflight response for 1 hour
        })
    )

    // Security headers
    .onRequest(({ set }) => {
        set.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'";
        set.headers["X-Frame-Options"] = "DENY";
        set.headers["X-Content-Type-Options"] = "nosniff";

    })

    // Handle CORS for preflight requests (OPTIONS method)
    .options("/*", ({ set }) => {
        set.headers["Access-Control-Allow-Origin"] = "https://qwik.mypostech.store";
        set.headers["Access-Control-Allow-Credentials"] = "true";
        set.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
        set.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
        return new Response(null, { status: 204 }); // 204 No Content for preflight
    })
    .onRequest(rateLimitMiddleware)

    .use(homePlugin)
    // .use(qrCodePlugin)
    .use(regPlugin)
    // .use(usersRoute)
    .use(loginPlugin)
    .use(categoriesPlugin)
    .use(suppPlugin)
    .use(prodPlugin)
    .use(qrCodePlugin)
    .use(automateTasks)
    .use(mailPlugin)
    .use(CustomersPlugin)
    .use(analyticsRoute)
    .use(authPlugin)

.listen(3000);
const endTime = Date.now(); // Start time tracking

console.log(`Server Execution Time: ${endTime - startTime}ms`);



console.log("Server is running in the link https://api.mypostech.store")





























// Define log file path inside the `logs` folder
const logFilePath = path.join("logs", "logs.log");

// Function to log memory usage
const logMemoryUsage = () => {
    const memoryUsage = process.memoryUsage();
    const logMessage = `
📝 Memory Usage Log - ${new Date().toISOString()}
------------------------------------------------
Cache Size: Memory Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
------------------------------------------------
`;

    // Check for high memory usage
    if (memoryUsage.heapUsed / 1024 / 1024 > 300) {
        console.warn("⚠️ High memory usage detected! Consider clearing the cache.");
    }

    // Append log message to file
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error("❌ Failed to write memory log:", err);
        }
    });

};

// Start Memory Logging (Every 1 hour)
setInterval(logMemoryUsage, 39600000);



// ✅ Make sure this is at the end of your server file
