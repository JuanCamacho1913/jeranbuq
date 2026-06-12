export { auth as middleware } from "@/backend/lib/auth";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|$).*)",
  ],
};
