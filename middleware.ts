import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // 인증 없이 모든 요청 허용
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 정적 파일을 제외한 모든 경로 매칭
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
