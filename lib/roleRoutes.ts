export type Role = 'ADMIN' | 'MANAGER' | 'ARTIST' | 'CUSTOMER'

export const ROLE_HOME_MAP: Record<Role, string> = {
    ADMIN: '/admin-dashboard',
    MANAGER: '/manager-dashboard',
    ARTIST: '/artist-dashboard',
    CUSTOMER: '/customer-dashboard',
}

export const ROLE_ALLOWED_PATHS: Record<Role, string[]> = {
    ADMIN: ['/admin-dashboard', '/dashboard'],
    MANAGER: ['/manager-dashboard', '/dashboard'],
    ARTIST: [
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
}

export function getHomeByRole(role: string): string {
    return ROLE_HOME_MAP[role as Role] ?? '/customer-dashboard'
}