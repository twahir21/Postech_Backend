import { Elysia } from "elysia"

const allowedOrigins = [
  "https://www.mypostech.store",
  "https://qwik.mypostech.store",
]

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
