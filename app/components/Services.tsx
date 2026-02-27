import styles from "./Services.module.css";

const services = [
    {
        id: "ready-made",
        icon: "📦",
        iconGradient: "from-purple-600 to-blue-500",
        title: "Ready-Made Assets",
        description:
            "Browse and purchase pre-made 3D/AR files. Instant download, ready to deploy across platforms with full commercial rights.",
        link: "Browse Marketplace",
        href: "#marketplace",
    },
    {
        id: "pre-order",
        icon: "🕐",
        iconGradient: "from-indigo-500 to-purple-600",
        title: "Pre-Order Concepts",
        description:
            "Reserve upcoming 3D content during concept stage. Early access pricing and priority delivery.",
        link: "View Concepts",
        href: "#concepts",
    },
    {
        id: "custom",
        icon: "✨",
        iconGradient: "from-blue-500 to-cyan-400",
        title: "Custom Production",
        description:
            "End-to-end full-service pipeline. From photography to 3D modeling to AR setup. Start your custom project today.",
        link: "Start Project",
        href: "#contact",
    },
];

const iconColors: Record<string, string> = {
    "ready-made": "linear-gradient(135deg, #7C3AED, #3B82F6)",
    "pre-order": "linear-gradient(135deg, #6366F1, #7C3AED)",
    custom: "linear-gradient(135deg, #3B82F6, #06B6D4)",
};

export default function Services() {
    return (
        <section className={styles.section} id="services">
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Our Services</h2>
                    <p className={styles.subtitle}>
                        Complete 3D/AR production pipeline from concept to delivery
                    </p>
                </div>

                <div className={styles.grid}>
                    {services.map((service) => (
                        <div key={service.id} className={styles.card}>
                            <div
                                className={styles.iconBox}
                                style={{ background: iconColors[service.id] }}
                            >
                                <span className={styles.iconEmoji}>{service.icon}</span>
                            </div>
                            <h3 className={styles.cardTitle}>{service.title}</h3>
                            <p className={styles.cardDesc}>{service.description}</p>
                            <a href={service.href} className={styles.cardLink}>
                                {service.link}
                                <svg
                                    className={styles.arrow}
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
