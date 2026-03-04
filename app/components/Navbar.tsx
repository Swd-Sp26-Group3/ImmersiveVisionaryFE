"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
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
                    <div className={styles.logoIcon}>IV</div>
                    <span className={styles.logoText}>Immersive Visionary</span>
                </div>

                <ul className={styles.navLinks}>
                    <li><a href="#services">Services</a></li>
                    <li><a href="/marketplace">Marketplace</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                    <li><a href="#case-studies">Case Studies</a></li>
                </ul>

                <div className={styles.navActions}>
                    <Link href="/sign-in" className={styles.signIn}>Sign In</Link>
                    <a href="#" className={styles.getStarted}>Get Started</a>
                </div>
            </nav>
        </header>
    );
}
