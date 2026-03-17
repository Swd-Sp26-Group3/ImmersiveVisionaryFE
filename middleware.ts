import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

// path mà guest có thể view
const PUBLIC_PATHS = ['/', '/login', '/signup', '/marketplace'];

//Khi role cụ verify thành công ở login thì đây là đường dẫn họ có quyền truy cập
const ROLE_ROUTES: Record<string, string[]> = {
    ADMIN: ['/admin-dashboard'],
    MANAGER: ['/manager-dashboard'],
    ARTIST: ['/artist-dashboard', '/marketplace', '/checkout', '/order', '/order-success'],
    CUSTOMER: ['/customer-dashboard', '/homepage', '/marketplace', '/checkout', '/order', '/order-success', '/studio-custom'],
};

//Khi login thành công thì mỗi role sẽ được tự động điều hướng đến path cụ thể 
const ROLE_HOME: Record<string, string> = {
    ADMIN: '/admin-dashboard',
    MANAGER: '/manager-dashboard',
    ARTIST: '/artist-dashboard',
    CUSTOMER: '/customer-dashboard',
};

// Config = middleware sẽ được chạy ở đâu qua matcher
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

    // Bỏ qua static files và API
    if (
        pathname.startsWith("/api/") ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon")
    ) {
        return NextResponse.next();
    }

    // Không có cả 2 token thì sẽ quay lại login
    const token = req.cookies.get("accessToken")?.value;
    const refreshToken = req.cookies.get("refreshToken")?.value;
    console.log("Token:", token ? "CÓ TOKEN" : "KHÔNG CÓ TOKEN");

    //Dùng PUBLIC_PATHS — bao gồm /marketplace và /marketplace/*
    const isPublic = PUBLIC_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isPublic) {
        console.log(" Public path, checking access for logged-in users:", pathname);

        // Even for public paths, if they are logged in as MANAGER, block marketplace
        if (token || refreshToken) {
            try {
                // Try to get role from token if available, otherwise just continue (it's public)
                const currentToken = token || refreshToken;
                if (currentToken) {
                    const { payload } = await jwtVerify(
                        new TextEncoder().encode(token ? token : "").byteLength > 0 ? token! : (refreshToken ? refreshToken : ""),
                        secret
                    ).catch(() => ({ payload: null }));

                    if (payload) {
                        const role = (payload.role as string)?.toUpperCase();
                        if ((role === 'MANAGER' || role === 'ADMIN') && (pathname === '/marketplace' || pathname.startsWith('/marketplace/'))) {
                            console.log(` ${role} trying to access marketplace -> redirecting`);
                            const redirectPath = role === 'ADMIN' ? '/admin-dashboard' : '/manager-dashboard';
                            return NextResponse.redirect(new URL(redirectPath, req.url));
                        }
                    }
                }
            } catch (err) {
                // Ignore errors here, let them view public path if verify fails
                console.log("Verify in public path failed:", err);
            }
        }

        return NextResponse.next();
    }

    if (!token && !refreshToken) {
        console.log(" Không có token → redirect /login");
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Có access token thì sẽ verify và check field role
    if (token) {
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
            // Token hết hạn → thử refresh bên dưới
        }
    }

    // Access token hết hạn thì Thử refresh token
    if (refreshToken) {
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
                    // Verify token thì mới lấy role
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
                    // Set cookie mới vào response
                    response.cookies.set("accessToken", newAccessToken, {
                        path: "/", maxAge: 15 * 60, sameSite: "strict",
                    });
                    response.cookies.set("refreshToken", newRefreshToken, {
                        path: "/", maxAge: 7 * 24 * 60 * 60, sameSite: "strict",
                    });

                    return response;
                }
            }
        } catch (err) {
            console.log("Refresh failed:", err);
        }
    }
    // nếu refresh thất bại thì quay về login
    return NextResponse.redirect(new URL("/login", req.url));
}