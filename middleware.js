import { NextResponse } from "next/server";

export function middleware(request) {
  const session = request.cookies.get("roster_session")?.value || "";
  const [role, secret] = session.split(":");

  const expected = {
    admin: process.env.ADMIN_SESSION_SECRET,
    staff: process.env.STAFF_SESSION_SECRET,
  };

  const isValid = Boolean(role) && Boolean(secret) && expected[role] === secret;
  const { pathname, searchParams } = request.nextUrl;

  const isPublicPath =
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/login");

  if (!isValid && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isValid && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Staff role: Dashboard + Old Rosters (archive) only. No creating/editing rosters,
  // no Employee Master, no Audit Log.
  if (isValid && role === "staff") {
    if (pathname.startsWith("/employees") || pathname.startsWith("/audit")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (pathname.startsWith("/roster") && searchParams.get("view") !== "archive") {
      const url = new URL("/roster", request.url);
      url.searchParams.set("view", "archive");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
