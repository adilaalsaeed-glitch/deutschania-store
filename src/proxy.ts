import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Temporary pre-launch gate (Vercel's built-in Password Protection needs a paid plan).
// Set SITE_USERNAME/SITE_PASSWORD in the environment to enable; unset (e.g. local dev)
// leaves the site open. The PayTabs webhook is excluded so it keeps working once that's
// wired up - PayTabs' servers can't answer a Basic Auth challenge.
export function proxy(request: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const username = process.env.SITE_USERNAME ?? "deutschania";
  const auth = request.headers.get("authorization");

  if (auth?.startsWith("Basic ")) {
    const decoded = atob(auth.slice(6));
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (user === username && pass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="deutschania"' },
  });
}

export const config = {
  matcher: ["/((?!api/paytabs/webhook|_next/static|_next/image|favicon.ico).*)"],
};
