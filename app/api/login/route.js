import { NextResponse } from "next/server";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Bad request" }, { status: 400 });
  }

  const { username, password } = body || {};

  const roles = [
    {
      role: "admin",
      user: process.env.ADMIN_USERNAME,
      pass: process.env.ADMIN_PASSWORD,
      secret: process.env.ADMIN_SESSION_SECRET,
    },
    {
      role: "staff",
      user: process.env.STAFF_USERNAME,
      pass: process.env.STAFF_PASSWORD,
      secret: process.env.STAFF_SESSION_SECRET,
    },
  ];

  const match = roles.find((r) => username && password && username === r.user && password === r.pass);

  if (match) {
    const res = NextResponse.json({ ok: true, role: match.role });
    res.cookies.set("roster_session", `${match.role}:${match.secret}`, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ ok: false, message: "Invalid username or password" }, { status: 401 });
}
