import type { NavigateFunction } from "react-router-dom";
import type {
  AppTourStep,
  UseAppTourResult,
} from "@/core/components/business/AppTour";

export interface OnboardingRuntime {
  pathname: string;
  navigate: NavigateFunction;
  tour: Pick<UseAppTourResult, "next" | "finish">;
}

export interface OnboardingStepCompletion {
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

export interface OnboardingStepConfig {
  step: AppTourStep;
  completion?: OnboardingStepCompletion;
}

export type OnboardingPreset = "quick" | "guided" | "full";

export interface OnboardingPresetConfig {
  label: string;
  description: string;
  image: string;
  imageAlt: string;
  steps: OnboardingStepConfig[];
}
