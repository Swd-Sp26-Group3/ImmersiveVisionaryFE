import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// Định nghĩa route được phép theo role
const ROLE_ROUTES: Record<string, string[]> = {
    ADMIN:    ["/dashboard/admin"],
    MANAGER:  ["/dashboard/manager"],
    ARTIST:   ["/dashboard/artist"],
    CUSTOMER: ["/homepage", "/profile"],
};

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Bỏ qua các route public
    const publicPaths = ["/login", "/signup", "/", "/api"];
    if (publicPaths.some((p) => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    // Lấy token từ cookie
    const token = req.cookies.get("accessToken")?.value;
    if (!token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        const role = (payload.role as string)?.toUpperCase();

        // Kiểm tra role có được phép vào route này không
        const allowedPaths = ROLE_ROUTES[role] ?? [];
        const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

        if (!isAllowed) {
            // Redirect về trang home của role đó
            const homeMap: Record<string, string> = {
                ADMIN: "/dashboard/admin",
                MANAGER: "/dashboard/manager",
                ARTIST: "/dashboard/artist",
                CUSTOMER: "/homepage",
            };
            return NextResponse.redirect(new URL(homeMap[role] ?? "/homepage", req.url));
        }

        return NextResponse.next();
    } catch {
        return NextResponse.redirect(new URL("/login", req.url));
    }
}

export const config = {
    matcher: ["/dashboard/:path*", "/homepage/:path*", "/profile/:path*"],
};