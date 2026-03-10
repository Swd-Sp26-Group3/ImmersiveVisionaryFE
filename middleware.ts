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
    const refreshToken = req.cookies.get("refreshToken")?.value;

    if (!token && !refreshToken) {
        console.log(" Không có token → redirect /login");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if(token) {
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
        } catch {

        }
    }

    if(refreshToken){
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });

            if (res.ok) {
                const data = await res.json();
                const newAccessToken = data.accessToken ?? data.data?.accessToken;
                const newRefreshToken = data.refreshToken ?? data.data?.refreshToken ?? refreshToken;

                if (newAccessToken) {
                    // Verify token mới để lấy role
                    const { payload } = await jwtVerify(
                        newAccessToken,
                        new TextEncoder().encode(process.env.JWT_SECRET!)
                    );
                    const role = (payload.role as string)?.toUpperCase();
                    const allowedPaths = ROLE_ROUTES[role] ?? [];
                    const isAllowed = allowedPaths.some((p) => pathname.startsWith(p));

                    const response = isAllowed
                        ? NextResponse.next()
                        : NextResponse.redirect(new URL(ROLE_HOME[role] ?? "/customer-dashboard", req.url));

                    //  Set cookie mới vào response
                    response.cookies.set("accessToken", newAccessToken, {
                        path: "/",
                        maxAge: 15 * 60,
                        sameSite: "strict",
                    });
                    response.cookies.set("refreshToken", newRefreshToken, {
                        path: "/",
                        maxAge: 7 * 24 * 60 * 60,
                        sameSite: "strict",
                    });

                    return response;
                }
            }
        } catch (err) {
            console.log("Refresh failed:", err);
        }    
    }

    return NextResponse.redirect(new URL("/login", req.url));
}