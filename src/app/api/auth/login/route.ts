// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";
import { type NextRequest } from "next/server";

async function ensureUsers() {
  const count = await prisma.user.count();
  if (count > 0) return;

  await prisma.user.create({
    data: { name: "Administrador", email: "admin@lacafeta.com", password: hashPassword("admin123"), role: "ADMIN", isActive: true },
  });

  const names = ["Adri","Kawtar","Canario","Aitana","Claudia","Málaga","Luca","Sofía","Elías","Villasante","Jose G","Ángel","Diego S","Bakr","Abrey","Vittorio","Lastra","Spark 1","Spark 2"];
  for (const name of names) {
    await prisma.user.create({
      data: { name, email: name.toLowerCase().replace(/\s+/g, "") + "@lacafeta.com", password: hashPassword("univa123"), role: "EMPLOYEE", isActive: true },
    });
  }

  const shifts = [{ name: "Mañana", startTime: "08:00", endTime: "14:00" }, { name: "Tarde", startTime: "14:00", endTime: "20:00" }, { name: "Cubrir", startTime: "10:00", endTime: "16:00" }];
  for (const s of shifts) {
    await prisma.shift.create({ data: s });
  }
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  await ensureUsers();

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
