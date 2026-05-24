# PROMPT 1/5 — FIX LOGIN + LUPA + TURNOS EN POS

## OBJECTIVE
Fix three critical bugs in `/home/bakr/UNIVA/La cafeta/web/`.

---

## 1. LOGIN BUTTONS NOT WORKING

### PROBLEM
The login page uses `"use client"` with `useRouter()` and `fetch()`. It depends on React hydration which sometimes fails silently. Users see the buttons but clicking does nothing.

### FIX
Replace `src/app/login/page.tsx` with pure `<a href>` links (no fetch, no useRouter):

```tsx
"use client";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">La Cafeta</h1>
          <p className="text-sm text-gray-500 mt-1">Sistema de gestión</p>
        </div>
        <p className="text-center text-sm text-gray-600 mb-6">Selecciona tu perfil</p>
        <div className="space-y-3">
          <a
            href="/api/auth/login-admin"
            className="block w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-xl text-center hover:bg-emerald-700"
          >
            Panel de Administración
          </a>
          <a
            href="/api/auth/login-employee"
            className="block w-full py-3 px-4 border-2 border-emerald-200 text-gray-800 font-semibold rounded-xl text-center hover:bg-emerald-50"
          >
            Portal de Empleado
          </a>
        </div>
        <p className="mt-6 text-center text-xs text-gray-400">acceso sin contraseña — uso interno</p>
      </div>
    </div>
  );
}
```

Create TWO new files:

`src/app/api/auth/login-admin/route.ts`:
```ts
import { createToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const token = await createToken({ userId: 1, role: "ADMIN" });
  const cookieStore = await cookies();
  cookieStore.set("token", token, { httpOnly: true, path: "/", maxAge: 28800, sameSite: "lax" });
  redirect("/hub-admin");
}
```

`src/app/api/auth/login-employee/route.ts`:
```ts
import { createToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const token = await createToken({ userId: 2, role: "EMPLOYEE" });
  const cookieStore = await cookies();
  cookieStore.set("token", token, { httpOnly: true, path: "/", maxAge: 28800, sameSite: "lax" });
  redirect("/hub-empleado");
}
```

---

## 2. LUPA (SEARCH ICON) OVERLAPPING TEXT

### PROBLEM
In ALL search inputs across the app, the magnifying glass icon overlaps the placeholder/search text.

### FIX
Find every search input in the app that has a search icon (lupa) and add proper padding so the text doesn't overlap.

The pattern is usually:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-light-grey" />
  <input className="pl-9 ..." placeholder="..." />
</div>
```

The key is the input needs `pl-9` (padding-left) to make room for the icon. Search through ALL files in `src/` for this pattern and ensure every search input has proper left padding (`pl-8` or `pl-9`).

Files that likely have this issue (check and fix all):
- `src/app/admin/personal/page.tsx` — employee and shift search
- `src/app/admin/productos/page.tsx` — product search
- `src/app/turno/page.tsx` — product search in POS
- `src/app/admin/materias-primas/page.tsx` — raw materials search
- Any other file with a search/lupa pattern

---

## 3. SHIFT ASSIGNMENTS NOT SHOWING IN POS

### PROBLEM
When an employee has a shift assigned, the POS panel (`/turno/page.tsx`) doesn't show the shift info or the protocol steps. The welcome message shows "no shift" even though the shift is assigned.

### FIX

Check and fix `src/app/turno/page.tsx`:

The current code loads shift assignments like this:
```tsx
const today = new Date().toISOString().slice(0, 10);
return fetch(`/api/shift-assignments?date=${today}`).then((r) => r.json()).then((list) => {
  const mine = list.find((a) => a.userId === me.id);
  if (mine) {
    setShiftInfo({ name: mine.shift.name, startTime: mine.shift.startTime, endTime: mine.shift.endTime, role: mine.role });
  }
  // ...
});
```

Make sure:
1. The fetch URL is correct: `/api/shift-assignments?date=YYYY-MM-DD`
2. The API returns assignments WITH the shift data included
3. The `userId` comparison works (both are numbers)
4. If shift is found, show shift info AND the opening/closing protocol steps
5. Add protocol steps to the `ShiftInfo` interface so they can be displayed

Also verify `src/app/api/shift-assignments/route.ts` returns `include: { shift: true }` so the shift data (including protocols) is available.

---

## IMPORTANT
- Do NOT change any visual design, colors, fonts
- Do NOT remove or modify any other functionality
- Do NOT touch the Prisma schema
- `npm run build` must pass

## FILES MODIFIED/CREATED
- `src/app/login/page.tsx` — replace
- `src/app/api/auth/login-admin/route.ts` — NEW
- `src/app/api/auth/login-employee/route.ts` — NEW
- `src/app/turno/page.tsx` — fix shift loading
- Various files with search inputs — fix lupa padding
