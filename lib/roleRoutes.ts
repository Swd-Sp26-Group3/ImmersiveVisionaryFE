export type Role = 'ADMIN' | 'MANAGER' | 'ARTIST' | 'CUSTOMER' 

export const ROLE_HOME_MAP: Record<Role, string> = {
    ADMIN:    '/dashboard/admin',
    MANAGER:  '/dashboard/manager',
    ARTIST:   '/dashboard/artist',
    CUSTOMER: '/homepage',
}

// Các route được phép truy cập theo role
export const ROLE_ALLOWED_PATHS: Record<Role, string[]> = {
    ADMIN:    ['/dashboard/admin', '/dashboard'],
    MANAGER:  ['/dashboard/manager', '/dashboard'],
    ARTIST:   ['/dashboard/artist'],
    CUSTOMER: ['/homepage', '/profile', '/products'],
}

export function getHomeByRole(role: string): string {
    return ROLE_HOME_MAP[role as Role] ?? '/homepage'
}