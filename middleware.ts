import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    const login = new URL("/login", req.nextUrl.origin);
    login.searchParams.set("callbackUrl", pathname);
    return Response.redirect(login);
  }

  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (pathname === "/" && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard/:path*"],
};
