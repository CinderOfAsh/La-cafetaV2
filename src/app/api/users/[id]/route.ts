// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: parseInt(id) },
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

  if (!user) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return Response.json(user);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, email, password, role, isActive, customFields } = await request.json();

  const data: Record<string, unknown> = {};
  if (name !== undefined) data.name = name;
  if (email !== undefined) data.email = email;
  if (password !== undefined) data.password = hashPassword(password);
  if (role !== undefined) data.role = role;
  if (isActive !== undefined) data.isActive = isActive;
  if (customFields !== undefined) data.customFields = typeof customFields === "string" ? customFields : JSON.stringify(customFields);

  const user = await prisma.user.update({
    where: { id: parseInt(id) },
    data,
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

  return Response.json(user);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.user.update({
    where: { id: parseInt(id) },
    data: { isActive: false },
  });
  return Response.json({ ok: true });
}
