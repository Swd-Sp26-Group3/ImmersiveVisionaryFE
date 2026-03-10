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
