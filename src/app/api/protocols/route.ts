// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");

  const where: Record<string, unknown> = {};
  if (type) where.type = type;

  const protocols = await prisma.protocol.findMany({
    where,
    include: {
      completions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      product: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(protocols);
}

export async function POST(request: NextRequest) {
  const { type, name, description, steps, productId } = await request.json();

  const protocol = await prisma.protocol.create({
    data: {
      type,
      name,
      description: description || "",
      steps: typeof steps === "string" ? steps : JSON.stringify(steps || []),
      productId: productId || null,
    },
  });

  return Response.json(protocol, { status: 201 });
}
