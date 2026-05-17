// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { createToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  let user;

  if (password === "admin") {
    user = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true } });
  } else if (password === "UNIVA") {
    user = await prisma.user.findFirst({ where: { role: "EMPLOYEE", isActive: true }, orderBy: { id: "asc" } });
  } else {
    return Response.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  if (!user) {
    return Response.json({ error: "No hay usuarios disponibles" }, { status: 401 });
  }

  const token = await createToken({ userId: user.id, role: user.role });

  const response = Response.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  response.headers.set(
    "Set-Cookie",
    `token=${token}; HttpOnly; Path=/; Max-Age=28800; SameSite=Lax`
  );

  return response;
}
