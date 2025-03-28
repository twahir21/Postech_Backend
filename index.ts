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

const startTime = Date.now(); // Start time tracking

// initialize translation before start the server
await setupI18n();
new Elysia()
    // security
    .use(cors({
        // origin: "https://yourfrontend.com", // Restrict CORS to your frontend
        credentials: true, // Allow cookies
    }))
    // set CSP for security headers for prevent XSS
    .onRequest(({ set }) => {
        set.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'";
        // set.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"; // Force HTTPS
        set.headers["X-Frame-Options"] = "DENY"; // Prevent clickjacking
        set.headers["X-Content-Type-Options"] = "nosniff"; // Prevent MIME type sniffing
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

.listen(3000);
const endTime = Date.now(); // Start time tracking

console.log(`Server Execution Time: ${endTime - startTime}ms`);



console.log("Server is running in the link http://localhost:3000")





























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
