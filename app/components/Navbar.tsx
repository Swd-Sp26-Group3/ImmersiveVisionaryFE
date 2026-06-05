"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./Navbar.module.css";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
    const { user, isAuthenticated } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
            <nav className={styles.nav}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon} style={{ padding: 0, overflow: 'hidden' }}>
                        <Image
                            src="/imvrs-logo.png?v=11"
                            alt="IMVRS Logo"
                            width={44}
                            height={44}
                            className="object-contain w-full h-full"
                        />
                    </div>
                    <span className={styles.logoText}>Immersive Visionary</span>
                </div>

                <ul className={styles.navLinks}>
                    <li><a href="#services">Services</a></li>
                    {!(isAuthenticated && (user?.role === "MANAGER" || user?.role === "ADMIN")) && (
                        <li><a href="#marketplace">Marketplace</a></li>
                    )}
                    <li><a href="#pricing">Pricing</a></li>
                    <li><a href="#case-studies">Case Studies</a></li>
                </ul>

                <div className={styles.navActions}>
                    <a href="#" className={styles.signIn}>Sign In</a>
                    <a href="#" className={styles.getStarted}>Get Started</a>
                </div>
            </nav>
        </header>
    );
}
