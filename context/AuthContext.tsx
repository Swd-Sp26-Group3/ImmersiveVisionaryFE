"use client";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
    User,
    login as apiLogin,
    logout as apiLogout,
    getUserFromStorage,
} from "@/lib/authService";
import { getHomeByRole } from "@/lib/roleRoutes";
import { clearTokens } from "@/lib/api";
import { onForceLogout } from "@/lib/authEvents";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Rehydrate from localStorage on mount
    useEffect(() => {
        const savedUser = getUserFromStorage();
        const token = localStorage.getItem("accessToken");
        if (savedUser && token) {
            setUser(savedUser);
        }
        setIsLoading(false);

        // Periodic check: if both cookie and localStorage token disappear,
        // another tab likely triggered a logout — sync UI state.
        const interval = setInterval(() => {
            const cookieToken = document.cookie
                .split("; ")
                .find((r) => r.startsWith("accessToken="))
                ?.split("=")[1];
            const localToken = localStorage.getItem("accessToken");

            if (!cookieToken && !localToken && user) {
                setUser(null);
            }
        }, 30_000);

        return () => clearInterval(interval);
    }, []);

    /**
     * Listen for force-logout events emitted by api.ts when a token refresh fails.
     * Using router.push() here preserves all React state (Cart, etc.) — no full reload.
     */
    const handleForceLogout = useCallback(() => {
        setUser(null);
        clearTokens();
        router.push("/login");
    }, [router]);

    useEffect(() => {
        const unsubscribe = onForceLogout(handleForceLogout);
        return unsubscribe;
    }, [handleForceLogout]);

    const login = async (email: string, password: string) => {
        const loggedInUser = await apiLogin(email, password);
        setUser(loggedInUser);
        const destination = getHomeByRole(loggedInUser.role ?? "CUSTOMER");
        // Hard navigation on login: forces middleware to re-read the new cookie.
        // This is intentional — we need the server to acknowledge the fresh token.
        window.location.replace(destination);
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch {
            // ignore API error, still clear local session
        } finally {
            setUser(null);
            clearTokens();
            // Hard navigation on logout: ensures cookie is fully purged from
            // middleware before the next request goes out.
            window.location.replace("/login");
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
