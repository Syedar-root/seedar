import { useEffect, useMemo, useRef } from "react";
import type { NavigateFunction } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppTour,
  useAppTour,
  type AppTourStep,
  type UseAppTourResult,
} from "@/core/components/business/AppTour";

/**
 * 步骤 1：运行时上下文
 * 仅暴露流程推进所需能力，避免步骤回调直接依赖外部复杂状态。
 */
interface OnboardingRuntime {
  pathname: string;
  navigate: NavigateFunction;
  tour: Pick<UseAppTourResult, "next" | "finish">;
}

/**
 * 步骤 2：动作驱动的步骤守卫定义
 * - selector / eventName：声明监听目标与事件类型。
 * - canActivate：运行时门禁（如仅在指定路由生效）。
 * - validate：触发动作后进行业务级校验，支持异步。
 * - onComplete：仅在校验通过后推进步骤。
 */
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

/**
 * 步骤 3：单步配置模型
 * - step：展示层配置（标题、描述、锚点等）。
 * - completion：行为层配置（存在时代表强制动作步骤）。
 */
interface OnboardingStepConfig {
  step: AppTourStep;
  completion?: OnboardingStepCompletion;
}

const HIDDEN_ACTION_STYLE = { display: "none" } as const;
const DEFAULT_WAIT_TIMEOUT_MS = 8000;
const STEP4_WAIT_SELECTOR = '[data-tour-id="datasource-create-button"]';

/**
 * 步骤 4：数据驱动的引导步骤定义
 * 后续新增步骤时，优先在这里增改，管理器逻辑保持通用。
 */
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
      description:
        "这是强制步骤：请点击“数据源”导航项，完成后才会继续。",
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
        // 关键修复：先导航，再等待下一步目标出现，最后推进到下一步。
        // 这样可避免“先 next 再渲染”导致的 target 丢失。
        navigate("/datasource");
        await waitForTarget(STEP4_WAIT_SELECTOR, DEFAULT_WAIT_TIMEOUT_MS);
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
      selector: STEP4_WAIT_SELECTOR,
      placement: "bottom",
      closable: false,
      nextButtonProps: { style: HIDDEN_ACTION_STYLE },
      prevButtonProps: { style: HIDDEN_ACTION_STYLE },
    },
    completion: {
      selector: STEP4_WAIT_SELECTOR,
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

/**
 * 步骤 5：等待目标元素出现
 * 目的：
 * - SPA 场景下，目标节点可能因路由切换或异步数据而延迟渲染。
 * - 如果只做一次 querySelector，容易错过时机并导致强制步骤卡住。
 *
 * 机制：
 * - 先做一次快速查询；
 * - 未命中时使用 MutationObserver 监听 document.body；
 * - 命中即 resolve，超时即 reject，避免观察器长期驻留。
 */
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

/**
 * 步骤 6：事件委托命中辅助函数
 * 仅在事件目标是 Element 时使用 closest(selector) 进行命中判断。
 */
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

  /**
   * 步骤 7：引导会话状态
   * - 使用稳定的 storage key（不带版本后缀）；
   * - 关闭引导不自动标记完成，强制步骤必须通过动作达成。
   */
  const tour = useAppTour({
    storageKey: "seedar-onboarding-app-layout-tour",
    autoStart: true,
    markCompletedOnClose: false,
  });

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

  const currentStepConfig = APP_ONBOARDING_STEP_CONFIGS[tour.current];

  /**
   * 步骤 8：活动守卫令牌
   * 每次步骤变化都更新令牌，异步回调在执行前必须校验令牌一致，
   * 以避免“旧步骤的异步结果推进新步骤”的竞态问题。
   */
  const guardTokenRef = useRef(0);
  // 防止双击/冒泡重复触发导致并发进入校验链路。
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

    /**
     * 步骤 9：目标就绪探测
     * 即使采用事件委托，也提前等待目标出现，收益是：
     * - 明确强制步骤是否具备可操作目标；
     * - 提供可控的超时分支；
     * - 为后续滚动定位等增强留接口。
     */
    waitForTarget(selector, timeoutMs).catch((error) => {
      if (isDisposed || currentToken !== guardTokenRef.current) {
        return;
      }
      completion.onTimeout?.(runtime);
      completion.onError?.(error, runtime);
    });

    /**
     * 步骤 10：基于 document 的事件委托监听
     * 采用委托的原因：
     * - 目标节点可能在 React 重新渲染后被替换；
     * - 直接绑在节点上的监听会随旧节点一起失效；
     * - 委托 + closest 命中可跨重渲染保持稳定。
     */
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

      // 步骤 10.1：进入校验链路前先加锁，直到本次流程结束。
      isCompletingRef.current = true;

      try {
        // 步骤 10.2：执行步骤守卫校验（可异步）。
        // validate 返回 false 时，说明动作触发了但业务条件未满足。
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

        // 步骤 10.3：校验通过，推进步骤（next 或 finish）。
        await completion.onComplete(runtime);
      } catch (error) {
        // 步骤 10.4：异常分支外抛给 onError，便于日志与恢复。
        completion.onError?.(error, runtime);
      } finally {
        // 步骤 10.5：无论成功失败都释放锁，避免后续步骤被阻塞。
        isCompletingRef.current = false;
      }
    };

    document.addEventListener(eventName, handleDelegatedEvent, true);

    return () => {
      isDisposed = true;
      document.removeEventListener(eventName, handleDelegatedEvent, true);
    };
  }, [currentStepConfig, runtime, tour.open]);

  /**
   * 步骤 11：交互策略切换
   * - 强制动作步骤：禁手动关闭/切步，只能通过动作达成推进；
   * - 普通说明步骤：保留默认下一步与关闭交互。
   */
  const isActionStep = Boolean(currentStepConfig?.completion);

  return (
    <AppTour
      open={tour.open}
      current={tour.current}
      keyboard={!isActionStep}
      closable={!isActionStep}
      disabledInteraction={!isActionStep}
      onClose={!isActionStep ? tour.close : undefined}
      onChange={!isActionStep ? tour.setCurrent : undefined}
      steps={APP_ONBOARDING_STEP_CONFIGS.map((item) => item.step)}
    />
  );
};

export default AppOnboardingManager;
