import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUSPENDED_PAGE = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Temporarily unavailable</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f7f7f7;color:#222;text-align:center}
main{max-width:30rem;padding:2rem}</style></head>
<body><main>
<h1>Temporarily unavailable</h1>
<p>This website is currently offline. Please check back soon.</p>
</main></body></html>`;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kill switch: set SITE_SUSPENDED=true in the host's environment variables.
  // /pesapal-ipn stays open so payment notifications for existing orders aren't lost.
  if (process.env.SITE_SUSPENDED === "true" && !pathname.startsWith("/pesapal-ipn")) {
    return new NextResponse(SUSPENDED_PAGE, {
      status: 503,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Retry-After": "86400",
        "Cache-Control": "no-store",
      },
    });
  }

  if (!pathname.startsWith("/admin")) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};