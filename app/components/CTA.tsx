import styles from "./CTA.module.css";

export default function CTA() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.card}>
                    {/* Background glow */}
                    <div className={styles.glowCenter} />

                    <div className={styles.content}>
                        <h2 className={styles.title}>
                            Ready to Transform Your
                            <br />
                            Products?
                        </h2>
                        <p className={styles.subtitle}>
                            Join 500+ brands using Immersive Visionary for 3D/AR advertising
                        </p>
                        <div className={styles.btnGroup}>
                            <button className={styles.primaryBtn}>Start Your Project</button>
                            <button className={styles.secondaryBtn}>Sign In</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
