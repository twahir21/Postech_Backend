import { Elysia } from "elysia"

const frontendURL = process.env.NODE_ENV === 'development'
                    ? process.env.FRONTEND_URL_DEV!
                    : process.env.FRONTEND_URL!

const allowedOrigins = [`${frontendURL}`]

export const csrfProtection = (app: Elysia) =>
  app.onBeforeHandle(({ request, set }) => {
    const origin = request.headers.get("origin")
    const method = request.method.toUpperCase()

    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      if (!origin || !allowedOrigins.includes(origin)) {
        set.status = 403
        return "Blocked: CSRF protection (invalid origin)"
      }
    }
  })
