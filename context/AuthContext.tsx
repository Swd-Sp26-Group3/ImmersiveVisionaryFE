"use client";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";

import {
    User,
    login as apiLogin,
    logout as apiLogout,
    getUserFromStorage,
} from "@/lib/authService";
import { getHomeByRole } from "@/lib/roleRoutes";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    // xóa thêm cookie nếu cần
};
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

        const interval = setInterval(() => {
            const cookieToken = document.cookie
                .split("; ")
                .find(r => r.startsWith("accessToken="))
                ?.split("=")[1];
            
            const localToken = localStorage.getItem("accessToken");
            
            // Nếu cookie bị xóa (đã logout từ tab khác), clear hết
            if (!cookieToken && localToken) {
                clearTokens();
                setUser(null);
            }
        }, 30_000);

    return () => clearInterval(interval);
    }, []);

    const login = async (email: string, password: string) => {
        const loggedInUser = await apiLogin(email, password);
        setUser(loggedInUser);
        
        const destination =  getHomeByRole(loggedInUser.role ?? "CUSTOMER");
        router.push(destination);
    };

    const logout = async () => {
        try {
            await apiLogout();
        } catch {
            // ignore API error, vẫn logout local
        } finally {
            setUser(null);
            router.push("/login");
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
