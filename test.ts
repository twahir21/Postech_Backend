import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const JWT_SECRET = "Fischl von Luftschloss Narfidort";

const app = new Elysia()
    .use(
        jwt({
            name: 'jwt',
            secret: JWT_SECRET
        })
    )
    // 🔹 Sign and store JWT in a cookie
    .get('/sign/:name', async ({ jwt, params: { name }, cookie }) => {
        const token = await jwt.sign({ name }) // ✅ Sign an object, not just a string

        cookie.auth.set({
            value: token,
            httpOnly: true,
            maxAge: 7 * 86400, // 7 days
            path: '/',
        })

        return `Signed in as ${name}`
    })
    // 🔹 Verify and access the JWT
    .get('/profile', async ({ jwt, error, cookie }) => {
        const token = cookie.auth?.value;
        if (!token) return error(401, 'Unauthorized - No token');

        const profile = await jwt.verify(token);
        if (!profile || !profile.name) return error(401, 'Unauthorized - Invalid token');

        return `Hello ${profile.name}`;
    })
    .listen(3000)

console.log('Server running on http://localhost:3000')
