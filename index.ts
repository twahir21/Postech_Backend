import Elysia from "elysia";
import homePlugin from "./plugin/home";
import qrCodePlugin from "./plugin/qrCode";
import regPlugin from "./plugin/registration";
import { setupI18n } from "./functions/translation";
import { cors } from "@elysiajs/cors";

import categoriesPlugin from "./plugin/categories";
import suppPlugin from "./plugin/supplier";
// import { rateLimitMiddleware } from "./functions/security/rateLimiting";
import { loginPlugin } from "./plugin/login";
import { prodPlugin } from "./plugin/products";
import automateTasks from "./plugin/autoSales";
import { mailPlugin } from "./plugin/email/smtp";
import cookie from "@elysiajs/cookie";
import { CustomersPlugin } from "./plugin/customer";
import analyticsRoute from "./plugin/analytics";
import { authPlugin } from "./plugin/authPlugin";
import settingsPlugin from "./plugin/settings";
import googlePlugin from "./plugin/google";
import paymentPlugin from "./plugin/payment";
// import { csrfProtection } from "./plugin/CSRF";

const startTime = Date.now(); // Start time tracking

// LOAD DATA PER ENV
const frontendURL = process.env.NODE_ENV  === 'development' 
                    ? process.env.FRONTEND_URL_DEV!
                    : process.env.FRONTEND_URL!


// initialize translation before start the server
await setupI18n();
new Elysia()
    // use cookie for JWT
    .use(cookie())

    // Proper CORS handling
    .use(
        cors({
          allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          maxAge: 3600,
          origin: frontendURL,

        })
      )
      .onRequest(({ set }) => {
        set.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'";
        set.headers["X-Frame-Options"] = "DENY";
        set.headers["X-Content-Type-Options"] = "nosniff";
      }
    )

    // 💥 Add it here (before plugins that handle POST/PUT/etc.)
    // .use(csrfProtection)
    // .onRequest(rateLimitMiddleware)

    .use(homePlugin)
    .use(regPlugin)
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
    .use(settingsPlugin)
    .use(googlePlugin)
    .use(paymentPlugin)

.listen(process.env.PORT ?? 3000) // am using Render.
const endTime = Date.now(); // Start time tracking

console.log(`Server Execution Time: ${endTime - startTime}ms`);

console.log("Server is running ... ")