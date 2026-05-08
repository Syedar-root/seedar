import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "antd";
import type { NavigateFunction } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppTour,
  useAppTour,
  type AppTourStep,
  type UseAppTourResult,
} from "@/core/components/business/AppTour";
import quickIllustration from "@/core/assets/illustration/quick.png";
import keyIllustration from "@/core/assets/illustration/key.png";
import fullIllustration from "@/core/assets/illustration/full.png";
import styles from "./AppOnboardingManager.module.scss";

interface OnboardingRuntime {
  pathname: string;
  navigate: NavigateFunction;
  tour: Pick<UseAppTourResult, "next" | "finish">;
}

interface OnboardingStepCompletion {
  selector?: string;
  eventName?: keyof DocumentEventMap;
  canActivate?: (runtime: OnboardingRuntime) => boolean;
  validate?: (runtime: OnboardingRuntime) => boolean | Promise<boolean>;
  onComplete: (runtime: OnboardingRuntime) => void | Promise<void>;
  onInvalid?: (runtime: OnboardingRuntime) => void;
  onError?: (error: unknown, runtime: OnboardingRuntime) => void;
  timeoutMs?: number;
  onTimeout?: (runtime: OnboardingRuntime) => void;
}

interface OnboardingStepConfig {
  step: AppTourStep;
  completion?: OnboardingStepCompletion;
}

type OnboardingPreset = "quick" | "guided" | "full";

const HIDDEN_ACTION_STYLE = { display: "none" } as const;
const DEFAULT_WAIT_TIMEOUT_MS = 8000;
const STEP_CREATE_DATASOURCE_SELECTOR = '[data-tour-id="datasource-create-button"]';

const APP_ONBOARDING_STEP_CONFIGS: OnboardingStepConfig[] = [
  {
    step: {
      title: "欢迎使用 Seedar",
      description:
        "这是全局导航区，你可以在仪表板、图表面板、数据集和数据源之间快速切换。",
      selector: '[data-tour-id="global-nav"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "推荐上手路径",
      description:
        "建议先配置数据源，再进行数据集建模，最后在仪表板中组合图表面板。",
      selector: '[data-tour-id="global-nav-datasource"]',
      placement: "bottom",
    },
  },
  {
    step: {
      title: "SeeMind 助手",
      description:
        "打开右上角开关后，可以在右侧侧栏使用 AI 助手进行分析与配置。",
      selector: '[data-tour-id="global-nav-seemind-switch"]',
      placement: "left",
    },
  },
  {
    step: {
      title: "先进入数据源页面",
      description: "这是强制步骤：请点击“数据源”导航项，完成后才会继续。",
      selector: '[data-tour-id="global-nav-datasource"]',
      placement: "bottom",
      closable: false,
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: {
      selector: '[data-tour-id="global-nav-datasource"]',
      eventName: "click",
      onComplete: async ({ navigate, tour }) => {
        navigate("/datasource");
        await waitForTarget(
          STEP_CREATE_DATASOURCE_SELECTOR,
          DEFAULT_WAIT_TIMEOUT_MS,
        );
        tour.next();
      },
      onError: (error) => {
        console.error("引导步骤[进入数据源]执行失败：", error);
      },
      onTimeout: () => {
        console.warn("引导步骤[进入数据源]等待目标超时。");
      },
    },
  },
  {
    step: {
      title: "创建数据源",
      description:
        "这是强制步骤：请点击数据源页面右上角的“创建数据源”按钮。",
      selector: STEP_CREATE_DATASOURCE_SELECTOR,
      placement: "bottom",
      closable: false,
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: {
      selector: STEP_CREATE_DATASOURCE_SELECTOR,
      eventName: "click",
      canActivate: ({ pathname }) => pathname === "/datasource",
      validate: ({ pathname }) => pathname === "/datasource",
      onComplete: ({ tour }) => {
        tour.finish();
      },
      onError: (error) => {
        console.error("引导步骤[创建数据源]执行失败：", error);
      },
      onTimeout: () => {
        console.warn("引导步骤[创建数据源]等待目标超时。");
      },
    },
  },
];

const ONBOARDING_PRESETS: Record<
  OnboardingPreset,
  {
    label: string;
    description: string;
    image: string;
    imageAlt: string;
    stepIndexes: number[];
  }
> = {
  quick: {
    label: "直接开用",
    description: "我已经会了，先自己操作。",
    image: quickIllustration,
    imageAlt: "直接开用",
    stepIndexes: [],
  },
  guided: {
    label: "看重点",
    description: "先带我走一遍关键步骤。",
    image: keyIllustration,
    imageAlt: "看重点",
    stepIndexes: [0, 3, 4],
  },
  full: {
    label: "完整带我",
    description: "从头到尾讲一遍，我想系统了解。",
    image: fullIllustration,
    imageAlt: "完整带我",
    stepIndexes: [0, 1, 2, 3, 4],
  },
};

const waitForTarget = (
  selector: string,
  timeoutMs: number = DEFAULT_WAIT_TIMEOUT_MS,
) => {
  return new Promise<HTMLElement>((resolve, reject) => {
    const immediate = document.querySelector(selector);
    if (immediate instanceof HTMLElement) {
      resolve(immediate);
      return;
    }

    const root = document.body;
    if (!root) {
      reject(new Error("waitForTarget：document.body 尚未就绪"));
      return;
    }

    let isDone = false;
    let timeoutId: number | undefined;
    const observer = new MutationObserver(() => {
      if (isDone) {
        return;
      }

      const node = document.querySelector(selector);
      if (!(node instanceof HTMLElement)) {
        return;
      }

      isDone = true;
      observer.disconnect();
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
      resolve(node);
    });

    observer.observe(root, { childList: true, subtree: true });

    timeoutId = window.setTimeout(() => {
      if (isDone) {
        return;
      }
      isDone = true;
      observer.disconnect();
      reject(new Error(`waitForTarget 超时：${selector}`));
    }, timeoutMs);
  });
};

const matchByClosest = (eventTarget: EventTarget | null, selector: string) => {
  if (!(eventTarget instanceof Element)) {
    return null;
  }
  return eventTarget.closest(selector);
};

export interface AppOnboardingManagerProps {}

export const AppOnboardingManager = (_props: AppOnboardingManagerProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tour = useAppTour({
    storageKey: "seedar-onboarding-app-layout-tour",
    autoStart: false,
    markCompletedOnClose: false,
  });

  const [selectedPreset, setSelectedPreset] = useState<OnboardingPreset | null>(
    null,
  );
  const isProfileModalOpen = !tour.isCompleted && selectedPreset === null;
  const hasBootstrappedRef = useRef(false);

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
    const indexes = ONBOARDING_PRESETS[selectedPreset].stepIndexes;
    return indexes.map((index) => APP_ONBOARDING_STEP_CONFIGS[index]);
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
  const guardTokenRef = useRef(0);
  const isCompletingRef = useRef(false);

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
        closable={!isActionStep}
        disabledInteraction={!isActionStep}
        onClose={!isActionStep ? tour.close : undefined}
        onChange={!isActionStep ? tour.setCurrent : undefined}
        steps={activeStepConfigs.map((item) => item.step)}
      />
    </>
  );
};

export default AppOnboardingManager;
