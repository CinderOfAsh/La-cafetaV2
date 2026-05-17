// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      customFields: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(users);
}

export async function POST(request: NextRequest) {
  const { name, email, password, role, customFields } = await request.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "El correo ya está registrado" }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashPassword(password),
      role,
      customFields: customFields ? JSON.stringify(customFields) : "{}",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      customFields: true,
      createdAt: true,
    },
  });

  return Response.json(user, { status: 201 });
}
