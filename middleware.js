import { NextResponse } from "next/server";

export function middleware(request) {
  const session = request.cookies.get("roster_session")?.value;
  const isValid = Boolean(session) && session === process.env.SESSION_TOKEN;
  const { pathname } = request.nextUrl;

  const isPublicPath =
    pathname.startsWith("/login") || pathname.startsWith("/api/login");

  if (!isValid && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isValid && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)"],
};
