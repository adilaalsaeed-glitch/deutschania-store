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
    // atob() throws on malformed base64 (e.g. a bot or stale client sending a garbled header) -
    // without this try/catch that exception was unhandled, turning a bad Authorization header
    // into a 500 instead of the intended 401 challenge.
    try {
      const decoded = atob(auth.slice(6));
      const separatorIndex = decoded.indexOf(":");
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === username && pass === password) {
        return NextResponse.next();
      }
    } catch {
      // fall through to the 401 challenge below
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
