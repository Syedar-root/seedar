import { useState, useCallback, useMemo } from "react";
import type {
  AskQuestionItem,
  InterruptAnswer,
  InterruptSubmitData,
  ChoiceOptionItem,
} from "../types";

export const parseOptions = (
  options: ChoiceOptionItem[] | undefined,
): ChoiceOptionItem[] => {
  return options || [];
};

interface UseInterruptFormOptions {
  questions: AskQuestionItem[];
  onSubmit?: (data: InterruptSubmitData) => void;
}

interface UseInterruptFormReturn {
  currentIndex: number;
  currentQuestion: AskQuestionItem | null;
  totalQuestions: number;
  progress: number;
  answers: Map<string, InterruptAnswer>;
  answeredIds: Set<string>;
  isCurrentAnswered: boolean;
  setAnswer: (questionId: string, answer: string | string[]) => void;
  jumpTo: (index: number) => void;
  goNext: () => void;
  goPrev: () => void;
  validateAndSubmit: () => void;
  isCompleted: boolean;
}

export const useInterruptForm = (
  options: UseInterruptFormOptions,
): UseInterruptFormReturn => {
  const { questions, onSubmit } = options;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, InterruptAnswer>>(
    new Map(),
  );

  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isCompleted = currentIndex >= totalQuestions;

  const answeredIds = useMemo(() => {
    return new Set(answers.keys());
  }, [answers]);

  const isCurrentAnswered = currentQuestion
    ? answeredIds.has(currentQuestion.id)
    : false;

  const setAnswer = useCallback(
    (questionId: string, answer: string | string[]) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return;

      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(questionId, {
          questionId,
          question: question.question,
          answer,
        });
        return next;
      });
    },
    [questions],
  );

  const jumpTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalQuestions) {
        setCurrentIndex(index);
      }
    },
    [totalQuestions],
  );

  const goNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, totalQuestions]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const validateAndSubmit = useCallback(() => {
    const firstUnansweredIndex = questions.findIndex(
      (q) => !answeredIds.has(q.id),
    );

    if (firstUnansweredIndex !== -1) {
      setCurrentIndex(firstUnansweredIndex);
      return;
    }

    const submitData: InterruptSubmitData = {
      answers: Array.from(answers.values()),
    };
    onSubmit?.(submitData);
    setCurrentIndex(totalQuestions);
  }, [questions, answeredIds, answers, onSubmit, totalQuestions]);

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    progress,
    answers,
    answeredIds,
    isCurrentAnswered,
    setAnswer,
    jumpTo,
    goNext,
    goPrev,
    validateAndSubmit,
    isCompleted,
  };
};
