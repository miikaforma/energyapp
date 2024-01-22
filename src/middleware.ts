import { type NextRequest, NextResponse } from 'next/server';
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const sessionToken = req.cookies.get('__Secure-next-auth.session-token') ?? req.cookies.get('next-auth.session-token');

  if (!sessionToken) {
    return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${path}`, req.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: ['/productions/:path*','/consumptions/:path*']
  // matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)','/ashp','/consumptions/:path*']
}


// Official example but seems like this is only supported if jwt is used
// export { default } from "next-auth/middleware"
// export const config = { matcher: ["/consumptions/:path*", '/productions/:path*'] }