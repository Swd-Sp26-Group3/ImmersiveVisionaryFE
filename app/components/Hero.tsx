import Image from "next/image";
import styles from "./Hero.module.css";

export default function Hero() {
    return (
        <section className={styles.hero}>
            {/* Background glow effects */}
            <div className={styles.glowLeft} />
            <div className={styles.glowRight} />

            <div className={styles.container}>
                <div className={styles.content}>
                    {/* Badge */}
                    <div className={styles.badge}>
                        <span className={styles.badgeDot} />
                        AR Production
                    </div>

                    {/* Headline */}
                    <h1 className={styles.headline}>
                        Transform
                        <br />
                        Products into
                        <br />
                        <span className={styles.highlight}>Immersive</span>
                        <br />
                        Experiences
                    </h1>

                    {/* Description */}
                    <p className={styles.description}>
                        Professional 3D modeling and AR advertising production. It&apos;s
                        time to transform your physical products to interactive digital
                        assets in days, not weeks.
                    </p>

                    {/* CTA Buttons */}
                    <div className={styles.ctaGroup}>
                        <button className={styles.primaryBtn}>
                            Start Custom Project
                        </button>
                        <button className={styles.secondaryBtn}>
                            Browse Marketplace
                        </button>
                    </div>

                    {/* Stats */}
                    <div className={styles.stats}>
                        <div className={styles.stat}>
                            <span className={styles.statValue}>500+</span>
                            <span className={styles.statLabel}>Brands Served</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>98%</span>
                            <span className={styles.statLabel}>Customer Satisfaction</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statValue}>48h</span>
                            <span className={styles.statLabel}>Average Delivery</span>
                        </div>
                    </div>
                </div>

                {/* Hero Visual */}
                <div className={styles.visual}>
                    <div className={styles.visualCard}>
                        {/* AR Ready badge */}
                        <div className={styles.arBadge}>
                            <span className={styles.arBadgeDot} />
                            AR Ready
                        </div>

                        {/* Platform glow rings */}
                        <div className={styles.glowRing1} />
                        <div className={styles.glowRing2} />
                        <div className={styles.glowRing3} />

                        {/* Device image */}
                        <div className={styles.deviceWrapper}>
                            <Image
                                src="/ar-device.png"
                                alt="AR 3D Product Visualization"
                                width={420}
                                height={420}
                                className={styles.deviceImage}
                                priority
                            />
                        </div>
                    </div>

                    {/* Floating info cards - outside to avoid overflow clip */}
                    <div className={styles.floatCard1}>
                        <span className={styles.floatIcon}>📦</span>
                        <div>
                            <div className={styles.floatTitle}>3D Model</div>
                            <div className={styles.floatSub}>Ready for AR</div>
                        </div>
                    </div>
                    <div className={styles.floatCard2}>
                        <span className={styles.floatIcon}>✨</span>
                        <div>
                            <div className={styles.floatTitle}>WebAR</div>
                            <div className={styles.floatSub}>Cross-Platform</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
