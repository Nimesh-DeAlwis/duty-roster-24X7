import { NextResponse } from "next/server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }

  const { username, password } = body || {};
  const validUser = process.env.ADMIN_USERNAME;
  const validPass = process.env.ADMIN_PASSWORD;
  const token = process.env.SESSION_TOKEN;

  if (
    username &&
    password &&
    username === validUser &&
    password === validPass
  ) {
    const res = NextResponse.json({ ok: true });
    res.cookies.set("roster_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    return res;
  }

  return NextResponse.json(
    { ok: false, message: "Invalid username or password" },
    { status: 401 }
  );
}
