import styles from "./Pipeline.module.css";

const steps = [
    {
        num: 1,
        icon: "📋",
        title: "Brief Submission",
        desc: "Share your images and requirements",
    },
    {
        num: 2,
        icon: "📷",
        title: "Photography",
        desc: "Studio or on-site product shoot",
    },
    {
        num: 3,
        icon: "📦",
        title: "3D Modeling",
        desc: "Precision modeling in Blender",
    },
    {
        num: 4,
        icon: "⚙️",
        title: "AR Setup",
        desc: "Specify and set up the AR experience",
    },
    {
        num: 5,
        icon: "🎨",
        title: "Post Production",
        desc: "Graphic enhancement",
    },
    {
        num: 6,
        icon: "🔬",
        title: "Testing",
        desc: "Multi-platform QA",
    },
    {
        num: 7,
        icon: "👁️",
        title: "Client Review",
        desc: "Approval and feedback",
    },
    {
        num: 8,
        icon: "🚀",
        title: "Delivery",
        desc: "Get your files sent",
    },
];

export default function Pipeline() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Production Pipeline</h2>
                    <p className={styles.subtitle}>
                        From brief to delivery in 7 streamlined steps
                    </p>
                </div>

                <div className={styles.grid}>
                    {steps.map((step) => (
                        <div key={step.num} className={styles.step}>
                            <div className={styles.iconCircle}>
                                <span className={styles.icon}>{step.icon}</span>
                            </div>
                            <div className={styles.stepContent}>
                                <h3 className={styles.stepTitle}>
                                    {step.num}. {step.title}
                                </h3>
                                <p className={styles.stepDesc}>{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
