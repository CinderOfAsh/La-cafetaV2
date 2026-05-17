// @ts-nocheck
export async function POST() {
  const response = Response.json({ ok: true });
  response.headers.set(
    "Set-Cookie",
    "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
  );
  return response;
}
