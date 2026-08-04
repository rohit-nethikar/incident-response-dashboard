export { default } from "next-auth/middleware";

// Protects every dashboard route — unauthenticated visitors are redirected
// to the sign-in page. Role-level restrictions (e.g. Admin-only screens)
// are enforced per-page/per-API-call, not here, since they depend on more
// than "is there a session".
export const config = {
  matcher: ["/((?!signin|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
