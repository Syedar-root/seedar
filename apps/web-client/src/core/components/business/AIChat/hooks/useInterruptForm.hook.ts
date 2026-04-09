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
  onSubmit?: (data: string, isResume: boolean) => void;
  answers?: InterruptAnswer[];
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
  cancelAndSubmit: () => void;
  isCompleted: boolean;
  isCancelled: boolean;
}

export const useInterruptForm = (
  options: UseInterruptFormOptions,
): UseInterruptFormReturn => {
  const { questions, onSubmit, answers: propsAnswers } = options;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCancelled, setIsCancelled] = useState(false);
  const [answers, setAnswers] = useState<Map<string, InterruptAnswer>>(
    propsAnswers?.reduce((prev, cur) => {
      prev.set(cur.questionId, cur);
      return prev;
    }, new Map()) || new Map(),
  );

  const currentQuestion = questions[currentIndex] || null;
  const totalQuestions = questions.length;
  const progress =
    totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isCompleted =
    currentIndex >= totalQuestions || answers.size === totalQuestions;

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
    const allAnswers = new Map(answers);
    questions.forEach((q) => {
      if (!allAnswers.has(q.id)) {
        allAnswers.set(q.id, {
          questionId: q.id,
          question: q.question,
          answer: "user rejected answer",
        });
      }
    });

    const submitData: InterruptSubmitData = {
      answers: Array.from(allAnswers.values()),
    };
    onSubmit?.(`user answer: ${JSON.stringify(submitData)}`, true);
    setCurrentIndex(totalQuestions);
  }, [answers, questions, onSubmit, totalQuestions]);

  const cancelAndSubmit = useCallback(() => {
    setIsCancelled(true);
    const allAnswers = new Map(answers);
    questions.forEach((q) => {
      allAnswers.set(q.id, {
        questionId: q.id,
        question: q.question,
        answer: "user rejected answer",
      });
    });

    const submitData: InterruptSubmitData = {
      answers: Array.from(allAnswers.values()),
    };
    onSubmit?.(`user answer: ${JSON.stringify(submitData)}`, true);
    setCurrentIndex(totalQuestions);
  }, [answers, questions, onSubmit, totalQuestions]);

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
    cancelAndSubmit,
    isCompleted,
    isCancelled,
  };
};
