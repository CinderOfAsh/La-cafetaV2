// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { type NextRequest } from "next/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const debt = await prisma.shiftDebt.update({
    where: { id: parseInt(id) },
    data: { isPaid: true },
  });
  return Response.json(debt);
}
