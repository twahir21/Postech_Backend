To implement the 14-day free trial and monthly manual payment logic in your POS system using Bun + Elysia + JWT-based auth, here’s a full implementation plan:

---

## 🔁 Requirements Recap

1. **Free trial**: 14 days for new users.
2. **After 14 days**: Block login (no token set) until payment is made manually.
3. **Monthly renewal**: If paid, allow login for 30 days.
4. **Manual confirmation**: Payment is confirmed manually (e.g., admin sets `isPaid = true`).
5. **Cookie/token**:
   - Set `auth_token` if user is within trial or payment period.
   - Auto-expire by checking a server-side expiry date (not relying only on cookie max-age).
   - Cookie is deleted on expiry.

---

## 🧠 Database Changes

Make sure your `shops` table includes:

```ts
createdAt: timestamp('created_at').defaultNow(),
isPaid: boolean('is_paid').default(false),
paidUntil: timestamp('paid_until').nullable(), // Used for both trial and paid duration
```

---

## 🧩 Token Creation & Middleware Auth Check

### ✅ When user registers

Set `paidUntil = now + 14 days` and `isPaid = false`

```ts
import { addDays } from 'date-fns';

await db.insert(shops).values({
  shopName,
  createdAt: new Date(),
  isPaid: false,
  paidUntil: addDays(new Date(), 14) // Set trial deadline
});
```

---

### 🔐 Token Generation Logic

In your login route:

```ts
import { isBefore } from 'date-fns';

const shop = await db.query.shops.findFirst({ where: eq(shops.id, shopId) });

if (!shop) return { success: false, message: 'Shop haijapatikana.' };

const now = new Date();

// Check if trial or paid period is still valid
if (!shop.paidUntil || isBefore(shop.paidUntil, now)) {
  return {
    success: false,
    message: "Muda wa huduma umeisha. Tafadhali lipia akaunti yako.",
  };
}

// All good — issue token
const token = await signJWT({ userId, shopId });

setCookie(c, 'auth_token', token, {
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7, // 7 days auto-login cookie
  path: '/',
});

return {
  success: true,
  message: 'Umefanikiwa kuingia.',
};
```

---

## ⛔ Middleware Check

In your JWT auth middleware:

```ts
.onBeforeHandle(async ({ cookie, set, jwt }) => {
  const token = cookie.get('auth_token')?.value;
  if (!token) throw new Error('Hakuna token');

  const payload = await verifyJWT(token);
  const shop = await db.query.shops.findFirst({ where: eq(shops.id, payload.shopId) });

  if (!shop || !shop.paidUntil || isBefore(shop.paidUntil, new Date())) {
    cookie.remove('auth_token'); // Delete expired cookie
    throw new Error('Huduma imeisha. Ingia tena baada ya malipo.');
  }

  // Store auth data in context if needed
  set('user', payload);
});
```

---

## 📅 Manual Payment Flow

When admin confirms payment:

```ts
import { addDays } from 'date-fns';

await db.update(shops)
  .set({
    isPaid: true,
    paidUntil: addDays(new Date(), 30) // Extend by 1 month
  })
  .where(eq(shops.id, shopId));
```

---

## 📦 Full Summary

| State             | isPaid | paidUntil       | Token Issued? |
|------------------|--------|------------------|----------------|
| New user         | false  | now + 14 days     | ✅              |
| Paid manually    | true   | now + 30 days     | ✅              |
| Expired trial    | false  | expired           | ❌              |
| Expired payment  | true   | expired           | ❌              |

---

If you'd like I can package this into reusable middleware and route modules for your Elysia server. Want me to do that?