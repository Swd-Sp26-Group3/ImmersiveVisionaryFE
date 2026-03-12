"use client";
import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useCallback,
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

// Kiem tra JWWT con han khong?
const isTokenExpired = (token: string) : boolean =>{
    try{
        const payload = JSON.parse(atob(token.split(".")[1]));

        return payload.exp * 1000 < Date.now() +10_000;
    } catch{
        return true;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const forceLogout = useCallback(async () => {
        try {
            await apiLogout(); // DELETE /auth/logout — best effort
        } catch {
            // Bỏ qua nếu API không reach được (token đã hết hạn → 401 cũng ok)
        } finally {
            clearTokens();
            setUser(null);
            router.push("/login");
        }
    }, [router]);

    // Rehydrate from localStorage on mount
    useEffect(() => {
        const savedUser = getUserFromStorage();
        const token = localStorage.getItem("accessToken");

        if (savedUser && token) {
            if(isTokenExpired(token)){
                forceLogout();
            } else{
                 setUser(savedUser);
            }
        }

        setIsLoading(false);

        //Kiem tra moi 30s : kiem tra token het han + dong bo log out
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
        
        // Lắng nghe storage event để đồng bộ logout tức thì giữa các tab
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "accessToken" && !e.newValue) {
                clearTokens();
                setUser(null);
                router.push("/login");
            }
        };
 
        // Lắng nghe 401 từ apiFetch — token hết hạn giữa chừng
        const handleUnauthorized = () => {
            forceLogout();
        };
 
        window.addEventListener("storage", handleStorageChange);
        window.addEventListener("auth:unauthorized", handleUnauthorized);
 
        return () => {
            clearInterval(interval);
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth:unauthorized", handleUnauthorized);
        };
    }, [forceLogout, router]);

    const login = async (email: string, password: string) => {
        const loggedInUser = await apiLogin(email, password);
        setUser(loggedInUser);
        const destination = getHomeByRole(loggedInUser.role ?? "CUSTOMER");
        router.push(destination);
        };
    
        const logout = async () => {
            await forceLogout();
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
    };

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used inside <AuthProvider>");
    }
    return ctx;
}
