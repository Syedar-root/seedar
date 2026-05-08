import celebrateIllustration from "@/core/assets/illustration/celebrate.png";
import type { OnboardingCelebrationDescriptionProps } from "./types";
import styles from "./OnboardingCelebrationDescription.module.scss";

export const OnboardingCelebrationDescription = ({
  message,
  imageAlt,
}: OnboardingCelebrationDescriptionProps) => {
  return (
    <div className={styles.root}>
      <span className={styles.message}>{message}</span>
      <img
        className={styles.image}
        src={celebrateIllustration}
        alt={imageAlt}
      />
    </div>
  );
};
