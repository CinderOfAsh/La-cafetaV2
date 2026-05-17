// @ts-nocheck
import { createToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { role } = await request.json();

  if (role === "admin") {
    const token = await createToken({ userId: 1, role: "ADMIN" });
    const response = Response.json({ id: 1, name: "Administrador", email: "admin@lacafeta.com", role: "ADMIN" });
    response.headers.set("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
    return response;
  }

  if (role === "employee") {
    const token = await createToken({ userId: 2, role: "EMPLOYEE" });
    const response = Response.json({ id: 2, name: "Adri", email: "adri@lacafeta.com", role: "EMPLOYEE" });
    response.headers.set("Set-Cookie", `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`);
    return response;
  }

  return Response.json({ error: "Rol inválido" }, { status: 400 });
}
