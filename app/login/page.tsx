"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./SignIn.module.css";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Suspense } from "react";

export default function SignInPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white italic">Đang tải...</div>}>
            <SignInContent />
        </Suspense>
    );
}

function SignInContent() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const fromSignup = searchParams.get("from") === "signup";

    // Pre-warm all dashboard routes so they are compiled BEFORE login completes
    useEffect(() => {
        router.prefetch('/customer-dashboard');
        router.prefetch('/manager-dashboard');
        router.prefetch('/admin-dashboard');
        router.prefetch('/artist-dashboard');
    }, [router]);

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
            setIsRedirecting(true);
            if (fromSignup) {
                router.push("/customer-dashboard?tab=profile");
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
            setErrorMessage(message);
            setIsLoading(false);
        }
    };


    return (
        <div className={styles.page}>
            {/* Full-screen redirect overlay */}
            {isRedirecting && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '24px',
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 28, animation: 'spin 1.5s linear infinite',
                        boxShadow: '0 0 40px rgba(124,58,237,0.6)',
                    }}>✦</div>
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#e2e8f0', fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>
                            Đang chuyển hướng...
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                            Đăng nhập thành công
                        </p>
                    </div>
                    {/* Progress bar */}
                    <div style={{
                        width: 200, height: 3,
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: 8, overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%', borderRadius: 8,
                            background: 'linear-gradient(90deg, #7c3aed, #06b6d4)',
                            animation: 'progress 1.5s ease-in-out infinite',
                        }} />
                    </div>
                    <style>{`
                        @keyframes spin { to { transform: rotate(360deg); } }
                        @keyframes progress {
                            0% { width: 0%; margin-left: 0; }
                            50% { width: 100%; margin-left: 0; }
                            100% { width: 0%; margin-left: 100%; }
                        }
                    `}</style>
                </div>
            )}
            {/* Background glow blobs */}
            <div className={styles.glowLeft} />
            <div className={styles.glowRight} />

            {/* Subtle grid overlay */}
            <div className={styles.gridOverlay} />

            <div className={styles.container}>
                {/* Logo / Back link */}
                <Link href="/" className={styles.logoLink}>
                    <div className={styles.logoIcon} style={{ padding: 0, overflow: 'hidden' }}>
                        <Image
                            src="/imvrs-logo.png?v=10"
                            alt="IMVRS Logo"
                            width={38}
                            height={38}
                            className="object-contain w-full h-full rounded-[10px]"
                        />
                    </div>
                    <span className={styles.logoText}>Immersive Visionary</span>
                </Link>

                {/* Card */}
                <div className={styles.card}>
                    <div className={styles.cardGlow} />

                    <div className={styles.cardInner}>
                        {/* Header */}
                        <div className={styles.header}>
                            <div className={styles.badge}>
                                <span className={styles.badgeDot} />
                                Chào mừng trở lại
                            </div>
                            <h1 className={styles.title}>Đăng nhập</h1>
                            <p className={styles.subtitle}>
                                Nhập thông tin đăng nhập để truy cập tài khoản
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.field}>
                                <label htmlFor="email" className={styles.label}>
                                    Địa chỉ Email
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
                                        placeholder="ban@example.com"
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
                                        Mật khẩu
                                    </label>
                                    <a href="#" className={styles.forgotLink}>Quên mật khẩu?</a>
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
                                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
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
                                className={`${styles.submitBtn} ${(isLoading || isRedirecting) ? styles.loading : ""}`}
                                disabled={isLoading || isRedirecting}
                            >
                                {isRedirecting ? (
                                    <>✓ Đang vào trang...</>
                                ) : isLoading ? (
                                    <span className={styles.spinner} />
                                ) : (
                                    "Đăng nhập"
                                )}
                            </button>
                        </form>


                        {/* Footer */}
                        <p className={styles.footerText}>
                            Chưa có tài khoản?{" "}
                            <Link href="/signup" className={styles.footerLink}>Tạo tài khoản miễn phí</Link>
                        </p>
                    </div>
                </div>

                {/* Bottom note */}
                <p className={styles.termsText}>
                    Bằng cách đăng nhập, bạn đồng ý với{" "}
                    <a href="#" className={styles.termsLink}>Điều khoản dịch vụ</a> và{" "}
                    <a href="#" className={styles.termsLink}>Chính sách bảo mật</a>
                </p>
            </div>
        </div>
    );
}
