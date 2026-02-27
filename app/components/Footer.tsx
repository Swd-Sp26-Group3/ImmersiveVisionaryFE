import styles from "./Footer.module.css";

const footerLinks = {
    Platform: ["3D Assets", "Pre-Order", "Custom Projects", "Pricing"],
    Resources: ["Documentation", "AR Guides", "Blog", "Case Studies"],
    Company: ["About", "Careers", "Partners", "Contact"],
    Legal: ["Privacy Policy", "Terms", "Cookies"],
};

const socialIcons = [
    {
        name: "Twitter",
        href: "#",
        path: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
    },
    {
        name: "LinkedIn",
        href: "#",
        path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z",
    },
    {
        name: "Instagram",
        href: "#",
        path: "M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 6.5h11a2.5 2.5 0 012.5 2.5v7a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 014 16V9a2.5 2.5 0 012.5-2.5z",
    },
];

export default function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.top}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <div className={styles.logoRow}>
                            <div className={styles.logoIcon}>IV</div>
                            <span className={styles.logoText}>Immersive Visionary</span>
                        </div>
                        <p className={styles.brandDesc}>
                            Professional 3D/AR production studio helping brands create
                            immersive digital experiences.
                        </p>
                        <div className={styles.social}>
                            {socialIcons.map((icon) => (
                                <a key={icon.name} href={icon.href} className={styles.socialLink} aria-label={icon.name}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                        <path d={icon.path} />
                                    </svg>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([category, links]) => (
                        <div key={category} className={styles.linkGroup}>
                            <h4 className={styles.linkGroupTitle}>{category}</h4>
                            <ul className={styles.linkList}>
                                {links.map((link) => (
                                    <li key={link}>
                                        <a href="#" className={styles.link}>{link}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        © 2025 Immersive Visionary. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
