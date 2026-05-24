# PROMPT 2/5 — FIX HUB BUTTONS + LOGOUT

## OBJECTIVE
Fix navigation buttons in hubs that don't work because they depend on `useRouter().push()` which requires React hydration.

---

## 1. HUB ADMIN — Replace router.push with <a> links

In `src/app/hub-admin/page.tsx`, replace the button `onClick={() => router.push(href)}` with a simple `<a href={href}>` link.

Change the card rendering from:
```tsx
<button onClick={() => router.push(href)} className="card-wellness group ...">
  <div className="flex h-12 w-12 ..."><Icon ... /></div>
  <div>
    <h3 className="...">{label}</h3>
    <p className="...">{desc}</p>
  </div>
</button>
```

To:
```tsx
<a href={href} className="card-wellness group flex flex-col items-start gap-3 p-6">
  <div className="flex h-12 w-12 ..."><Icon ... /></div>
  <div>
    <h3 className="...">{label}</h3>
    <p className="...">{desc}</p>
  </div>
</a>
```

Also fix the logout button: change from `fetch + router.push` to a plain `<a href="/api/auth/logout">`.

If there's already a `/api/auth/logout` POST endpoint, create a GET version too, or change the link to a form.

For the logout, simplest fix:
```tsx
<a href="/api/auth/logout" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-red-50 hover:text-red-500">
  <LogOut className="h-4 w-4" /> Cerrar sesión
</a>
```

Create `src/app/api/auth/logout/route.ts` with a GET handler (if it only has POST):
```ts
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("token");
  redirect("/login");
}
```

Also remove the `"use client"` directive and the `useRouter` import since they're no longer needed.

---

## 2. HUB EMPLEADO — Same fix

In `src/app/hub-empleado/page.tsx`, apply the exact same changes:
- Replace buttons with `<a>` links
- Replace the logout button with an `<a>` link
- Remove `"use client"` and `useRouter`

---

## 3. LOGOUT API — Ensure GET handler exists

If `src/app/api/auth/logout/route.ts` doesn't already have a GET handler, add it.

---

## FILES TO MODIFY
- `src/app/hub-admin/page.tsx`
- `src/app/hub-empleado/page.tsx`
- `src/app/api/auth/logout/route.ts` (possibly, add GET handler)

## TESTING
1. `npm run build` — must pass
2. Visit /login → click Admin → hub-admin loads with working cards
3. Click any card → navigates to the page
4. Click Cerrar sesión → logs out and redirects to /login
