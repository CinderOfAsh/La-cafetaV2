import { createToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function GET() {
  const token = await createToken({ userId: 1, role: "ADMIN" });
  const cookieStore = await cookies();
  cookieStore.set("token", token, { httpOnly: true, path: "/", maxAge: 28800, sameSite: "lax" });
  redirect("/hub-admin");
}
