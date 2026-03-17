"use client";
import { useState } from "react";
import Link from "next/link";
import styles from "./SignIn.module.css";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [errorMessage, setErrorMessage] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        if (!email || !password) {
            setErrorMessage('Tài khoản mail hoặc mật khẩu chưa đúng!!');
            return;
        }
        setIsLoading(true);
        try {
            await login(email, password);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className={styles.page}>
            {/* Background glow blobs */}
            <div className={styles.glowLeft} />
            <div className={styles.glowRight} />

            {/* Subtle grid overlay */}
            <div className={styles.gridOverlay} />

            <div className={styles.container}>
                {/* Logo / Back link */}
                <Link href="/" className={styles.logoLink}>
                    <div className={styles.logoIcon}>✦</div>
                    <span className={styles.logoText}>Immersive Visionary</span>
                </Link>

                {/* Card */}
                <div className={styles.card}>
                    {/* Card glow border accent */}
                    <div className={styles.cardGlow} />

                    <div className={styles.cardInner}>
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.badge}>
                                <span className={styles.badgeDot} />
                                Welcome Back
                            </div>
                            <h1 className={styles.title}>Sign In</h1>
                            <p className={styles.subtitle}>
                                Enter your credentials to access your workspace
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="email" className={styles.label}>
                                    Email Address
                                </label>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        className={styles.input}
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.labelRow}>
                                    <label htmlFor="password" className={styles.label}>
                                        Password
                                    </label>
                                    <a href="#" className={styles.forgotLink}>Forgot password?</a>
                                </div>
                                <div className={styles.inputWrapper}>
                                    <span className={styles.inputIcon}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className={styles.input}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword((p) => !p)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                                <line x1="1" y1="1" x2="23" y2="23" />
                                            </svg>
                                        ) : (
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {errorMessage && (
                                <p style={{ color: '#f87171', fontSize: '0.875rem', marginTop: '-0.5rem', textAlign: 'center' }}>
                                    {errorMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                className={`${styles.submitBtn} ${isLoading ? styles.loading : ""}`}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className={styles.spinner} />
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>


                        {/* Footer */}
                        <p className={styles.footerText}>
                            Don&apos;t have an account?{" "}
                            <Link href="/signup" className={styles.footerLink}>Create one free</Link>
                        </p>
                    </div>
                </div>

                {/* Bottom note */}
                <p className={styles.termsText}>
                    By signing in, you agree to our{" "}
                    <a href="#" className={styles.termsLink}>Terms of Service</a> and{" "}
                    <a href="#" className={styles.termsLink}>Privacy Policy</a>
                </p>
            </div>
        </div>
    );
}
