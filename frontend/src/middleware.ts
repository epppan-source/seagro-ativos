import { NextRequest, NextResponse } from "next/server"

const ROTAS_PUBLICAS = ["/login", "/esqueci-senha", "/redefinir-senha"]
const ROTAS_GESTOR_ONLY = ["/funcionarios", "/configuracoes"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = req.cookies.get("token")?.value
  const role = req.cookies.get("role")?.value

  if (ROTAS_PUBLICAS.some((r) => pathname.startsWith(r))) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (ROTAS_GESTOR_ONLY.some((r) => pathname.startsWith(r)) && role !== "gestor") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
