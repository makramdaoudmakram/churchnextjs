import { auth } from "@/auth";
import { hasValidCharitySession } from "@/lib/auth-session";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = hasValidCharitySession(req.auth);
  const forceLogin = req.nextUrl.searchParams.get("force") === "1";

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup") && !forceLogin) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (pathname === "/" && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/", "/login", "/signup", "/logout", "/dashboard/:path*"],
};
