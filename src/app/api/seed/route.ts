// @ts-nocheck
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST() {
  const existingUsers = await prisma.user.findFirst();
  if (existingUsers) {
    return Response.json({ message: "Datos ya inicializados" });
  }

  await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@lacafeta.com",
      password: hashPassword("admin123"),
      role: "ADMIN",
      isActive: true,
    },
  });

  const names = ["Adri","Kawtar","Canario","Aitana","Claudia","Málaga","Luca","Sofía","Elías","Villasante","Jose G","Ángel","Diego S","Bakr","Abrey","Vittorio","Lastra","Spark 1","Spark 2"];
  for (const name of names) {
    const email = name.toLowerCase().replace(/\s+/g, "") + "@lacafeta.com";
    await prisma.user.create({
      data: { name, email, password: hashPassword("univa123"), role: "EMPLOYEE", isActive: true },
    });
  }

  const shifts = [
    { name: "Mañana", startTime: "08:00", endTime: "14:00" },
    { name: "Tarde", startTime: "14:00", endTime: "20:00" },
    { name: "Cubrir", startTime: "10:00", endTime: "16:00" },
  ];
  for (const s of shifts) {
    await prisma.shift.create({ data: s });
  }

  return Response.json({ message: "Base de datos inicializada" });
}
