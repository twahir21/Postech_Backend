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
    .use(qrCodePlugin)
    .use(regPlugin)
    .use(usersRoute)
    .use(prodPlugin)

.listen(3000);

console.log("Server is running in the link http://localhost:3000")
























// Function to log memory usage
const logMemoryUsage = () => {
    const memoryUsage = process.memoryUsage();
    console.log(`
📝 Memory Usage Log - ${new Date().toISOString()}
------------------------------------------------
RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB
Heap Total: ${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB
Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB
External: ${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB
Array Buffers: ${(memoryUsage.arrayBuffers / 1024 / 1024).toFixed(2)} MB
------------------------------------------------
`);

};

// Start Memory Logging (Every 1 hour)
setInterval(logMemoryUsage, 3600000);

// ✅ Make sure this is at the end of your server file
