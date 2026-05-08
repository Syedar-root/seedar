import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { AppTour, useAppTour } from "@/core/components/business/AppTour";
import quickIllustration from "@/core/assets/illustration/quick.png";
import keyIllustration from "@/core/assets/illustration/key.png";
import fullIllustration from "@/core/assets/illustration/full.png";
import { FULL_ONBOARDING_STEPS } from "./fullSteps";
import { GUIDED_ONBOARDING_STEPS } from "./guidedSteps";
import {
  type OnboardingPreset,
  type OnboardingPresetConfig,
  type OnboardingRuntime,
} from "./types";
import {
  DEFAULT_WAIT_TIMEOUT_MS,
  matchByClosest,
  waitForTarget,
} from "./utils";
import styles from "./AppOnboardingManager.module.scss";

const ONBOARDING_PRESETS: Record<OnboardingPreset, OnboardingPresetConfig> = {
  quick: {
    label: "直接开用",
    description: "我已经会了，先自己操作。",
    image: quickIllustration,
    imageAlt: "直接开用",
    steps: [],
  },
  guided: {
    label: "看重点",
    description: "先带我走一遍关键入口，不强制操作。",
    image: keyIllustration,
    imageAlt: "看重点",
    steps: GUIDED_ONBOARDING_STEPS,
  },
  full: {
    label: "完整带我",
    description: "从路径到动作都讲一遍，并包含强制步骤。",
    image: fullIllustration,
    imageAlt: "完整带我",
    steps: FULL_ONBOARDING_STEPS,
  },
};

export interface AppOnboardingManagerProps {}

export const AppOnboardingManager = (_props: AppOnboardingManagerProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tour = useAppTour({
    storageKey: "seedar-onboarding-app-layout-tour",
    autoStart: false,
    markCompletedOnClose: true,
  });

  const [selectedPreset, setSelectedPreset] = useState<OnboardingPreset | null>(
    null,
  );
  const isProfileModalOpen = !tour.isCompleted && selectedPreset === null;
  const hasBootstrappedRef = useRef(false);
  const guardTokenRef = useRef(0);
  const isCompletingRef = useRef(false);

  const runtime = useMemo<OnboardingRuntime>(
    () => ({
      pathname: location.pathname,
      navigate,
      tour: {
        next: tour.next,
        finish: tour.finish,
      },
    }),
    [location.pathname, navigate, tour.finish, tour.next],
  );

  const activeStepConfigs = useMemo(() => {
    if (!selectedPreset) {
      return [];
    }
    return ONBOARDING_PRESETS[selectedPreset].steps;
  }, [selectedPreset]);

  useEffect(() => {
    if (hasBootstrappedRef.current || !selectedPreset) {
      return;
    }

    hasBootstrappedRef.current = true;

    if (selectedPreset === "quick") {
      tour.finish();
      return;
    }

    if (!tour.isCompleted) {
      tour.start(0);
    }
  }, [selectedPreset, tour]);

  const handleSelectPreset = (preset: OnboardingPreset) => {
    setSelectedPreset(preset);
  };

  const currentStepConfig = activeStepConfigs[tour.current];

  useEffect(() => {
    guardTokenRef.current += 1;
    const currentToken = guardTokenRef.current;

    if (!tour.open || !currentStepConfig?.completion) {
      return;
    }

    const { completion } = currentStepConfig;
    if (completion.canActivate && !completion.canActivate(runtime)) {
      return;
    }

    const selector = completion.selector ?? currentStepConfig.step.selector;
    if (!selector) {
      return;
    }

    const eventName = completion.eventName ?? "click";
    const timeoutMs = completion.timeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
    let isDisposed = false;

    waitForTarget(selector, timeoutMs).catch((error) => {
      if (isDisposed || currentToken !== guardTokenRef.current) {
        return;
      }
      completion.onTimeout?.(runtime);
      completion.onError?.(error, runtime);
    });

    const handleDelegatedEvent = async (event: Event) => {
      if (isDisposed || currentToken !== guardTokenRef.current) {
        return;
      }

      if (isCompletingRef.current) {
        return;
      }

      if (completion.canActivate && !completion.canActivate(runtime)) {
        return;
      }

      const matched = matchByClosest(event.target, selector);
      if (!matched) {
        return;
      }

      isCompletingRef.current = true;
      try {
        if (completion.validate) {
          const isValid = await completion.validate(runtime);
          if (!isValid) {
            completion.onInvalid?.(runtime);
            return;
          }
        }

        if (isDisposed || currentToken !== guardTokenRef.current) {
          return;
        }

        await completion.onComplete(runtime);
      } catch (error) {
        completion.onError?.(error, runtime);
      } finally {
        isCompletingRef.current = false;
      }
    };

    document.addEventListener(eventName, handleDelegatedEvent, true);
    return () => {
      isDisposed = true;
      document.removeEventListener(eventName, handleDelegatedEvent, true);
    };
  }, [currentStepConfig, runtime, tour.open]);

  const isActionStep = Boolean(currentStepConfig?.completion);
  return (
    <>
      <Modal
        open={isProfileModalOpen}
        title={null}
        footer={null}
        width={720}
        wrapClassName={styles.modalWrap}
        closable={false}
        maskClosable={false}
        keyboard={false}
        centered
      >
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.heading}>
              <h3>你想怎么开始？</h3>
              <p>选一个方式，我按你的节奏带你上手。</p>
            </div>
          </div>

          <div className={styles.optionGrid}>
            {(Object.keys(ONBOARDING_PRESETS) as OnboardingPreset[]).map(
              (preset) => {
                const item = ONBOARDING_PRESETS[preset];
                return (
                  <button
                    key={preset}
                    type="button"
                    className={styles.optionCard}
                    onClick={() => handleSelectPreset(preset)}
                  >
                    <img
                      className={styles.optionImage}
                      src={item.image}
                      alt={item.imageAlt}
                    />
                    <div className={styles.optionLabel}>{item.label}</div>
                    <div className={styles.optionDesc}>{item.description}</div>
                  </button>
                );
              },
            )}
          </div>
        </div>
      </Modal>

      <AppTour
        open={tour.open && !isProfileModalOpen && activeStepConfigs.length > 0}
        current={tour.current}
        keyboard={!isActionStep}
        closable
        disabledInteraction={!isActionStep}
        mask={selectedPreset === "guided" ? false : undefined}
        onClose={tour.close}
        onChange={!isActionStep ? tour.setCurrent : undefined}
        onFinish={tour.finish}
        zIndex={2000}
        steps={activeStepConfigs.map((item) => item.step)}
      />
    </>
  );
};

export default AppOnboardingManager;
