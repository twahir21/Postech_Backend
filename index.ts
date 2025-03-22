import Elysia from "elysia";
import homePlugin from "./plugin/home";
import qrCodePlugin from "./plugin/qrcode";
import regPlugin from "./plugin/registration";
import usersRoute from "./functions/usersFunc";
import prodPlugin from "./plugin/products";
import { setupI18n } from "./functions/translation";

// initialize translation before start the server
await setupI18n();

new Elysia()
    .use(homePlugin)
    // .use(qrCodePlugin)
    .use(regPlugin)
    // .use(usersRoute)
    // .use(prodPlugin)
    .use(categoriesPlugin)
    // .use(suppPlugin)

.listen(3000);

console.log("Server is running in the link http://localhost:3000")



























// Function to log memory usage

import fs from "fs";
import path from "path";
import categoriesPlugin from "./plugin/categories";
import suppPlugin from "./plugin/supplier";

// Define log file path inside the `logs` folder
const logFilePath = path.join("logs", "logs.txt");

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
