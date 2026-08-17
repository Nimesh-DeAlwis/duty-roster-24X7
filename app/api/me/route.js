import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const session = cookieStore.get("roster_session")?.value || "";
  const [role, secret] = session.split(":");

  const expected = {
    admin: process.env.ADMIN_SESSION_SECRET,
    staff: process.env.STAFF_SESSION_SECRET,
  };

  if (role && secret && expected[role] && secret === expected[role]) {
    return NextResponse.json({ role });
  }
  return NextResponse.json({ role: null });
}
