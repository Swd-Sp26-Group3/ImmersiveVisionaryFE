import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

const ROLE_ROUTES: Record<string, string[]> = {
    ADMIN:    ['/admin-dashboard'],
    MANAGER:  ['/manager-dashboard'],
    ARTIST:   [
        '/artist-dashboard',
        '/marketplace',
        '/checkout',
        '/order',
        '/order-success',
    ],
    CUSTOMER: [
        '/customer-dashboard',
        '/homepage',
        '/marketplace',
        '/checkout',
        '/order',
        '/order-success',
        '/studio-custom',
    ],
};

const ROLE_HOME: Record<string, string> = {
    ADMIN:    '/admin-dashboard',
    MANAGER:  '/manager-dashboard',
    ARTIST:   '/artist-dashboard',
    CUSTOMER: '/customer-dashboard',
};

export const config = {
    matcher: [
        '/admin-dashboard/:path*',
        '/manager-dashboard/:path*',
        '/artist-dashboard/:path*',
        '/customer-dashboard/:path*',
        '/homepage/:path*',
        '/marketplace/:path*',
        '/checkout/:path*',
        '/order/:path*',
        '/order-success/:path*',
        '/studio-custom/:path*',
    ],
};

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    console.log(" MIDDLEWARE CHẠY:", pathname);

    const publicPaths = ["/login", "/signup", "/"];
    const isPublic =
        publicPaths.includes(pathname) ||
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon");

    if (isPublic) {
        console.log(" Public path, bỏ qua", pathname);
        return NextResponse.next();
    }

    const token = req.cookies.get("accessToken")?.value;
    console.log("Token:", token ? "CÓ TOKEN" : "KHÔNG CÓ TOKEN");

    if (!token) {
        console.log(" Không có token → redirect /login");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        const role = (payload.role as string)?.toUpperCase();
        console.log("Role:", role);
        const allowedPaths = ROLE_ROUTES[role] ?? [];
        const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

        if (!isAllowed) {
            return NextResponse.redirect(
                new URL(ROLE_HOME[role] ?? "/customer-dashboard", req.url)
            );
        }

        return NextResponse.next();
    } catch (err) {
        console.log("Token lỗi:", err);
        return NextResponse.redirect(new URL("/login", req.url));
    }
}