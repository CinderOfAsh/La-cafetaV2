import { createToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const token = await createToken({ userId: 2, role: "EMPLOYEE" });
  const cookieStore = await cookies();
  cookieStore.set("token", token, { httpOnly: true, path: "/", maxAge: 28800, sameSite: "lax" });
  redirect("/hub-empleado");
}
