import React, { useEffect, useReducer, useRef, useState } from "react";
import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import type { AiInterruptPayload } from "#pkg/seedar/types";
import type {
  AskQuestionItem,
  ChoiceOptionItem,
} from "../../../../types";
import {
  parseOptions,
  useInterruptForm,
} from "../../../../hooks/useInterruptForm.hook";
import { ChoiceQuestion } from "../ChoiceQuestion";
import { ConfirmQuestion } from "../ConfirmQuestion";
import { ProgressBar } from "../ProgressBar";
import { TextQuestion } from "../TextQuestion";
import type { InterruptRendererProps } from "../../types";
import styles from "./AskUserInterrupt.module.scss";

interface FormState {
  textValue: string;
  confirmValue: string;
  choiceValue: string[];
  choiceOtherInput: string;
}

type FormAction =
  | { type: "RESET" }
  | { type: "SET_TEXT"; payload: string }
  | { type: "SET_CONFIRM"; payload: string }
  | { type: "SET_CHOICE"; payload: string[] }
  | { type: "SET_CHOICE_OTHER"; payload: string };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case "RESET":
      return {
        textValue: "",
        confirmValue: "",
        choiceValue: [],
        choiceOtherInput: "",
      };
    case "SET_TEXT":
      return { ...state, textValue: action.payload };
    case "SET_CONFIRM":
      return { ...state, confirmValue: action.payload };
    case "SET_CHOICE":
      return { ...state, choiceValue: action.payload, choiceOtherInput: "" };
    case "SET_CHOICE_OTHER":
      return { ...state, choiceOtherInput: action.payload };
    default:
      return state;
  }
};

const PlainInterrupt: React.FC<InterruptRendererProps> = ({
  content,
  onSubmit,
  disabled = false,
}) => {
  const [textValue, setTextValue] = useState("");

  if (typeof content !== "string") {
    return null;
  }

  const handleSubmit = () => {
    if (!textValue.trim() || disabled) {
      return;
    }

    onSubmit?.("", true, {
      kind: "interrupt_result",
      interruptResult: {
        kind: "ask_user_result",
        answers: [
          {
            questionId: "text",
            question: content,
            answer: textValue,
          },
        ],
      },
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>{content}</div>
      <div className={styles["input-row"]}>
        <Input
          value={textValue}
          onValueChange={setTextValue}
          disabled={disabled}
          onKeyDown={(event) => {
            if (event.key === "Enter" && textValue.trim() && !disabled) {
              handleSubmit();
            }
          }}
          placeholder="请输入..."
          className={styles["input-field"]}
        />
        <Button
          className={styles["primary-button"]}
          disabled={disabled}
          onClick={handleSubmit}
        >
          确认
        </Button>
      </div>
      {!disabled ? (
        <span className={styles["wait-answer"]}>SeeMind等你回答</span>
      ) : null}
    </div>
  );
};

const AskUserInterrupt: React.FC<InterruptRendererProps> = ({
  content,
  onSubmit,
  disabled = false,
}) => {
  if (typeof content === "string") {
    return (
      <PlainInterrupt
        content={content}
        onSubmit={onSubmit}
        disabled={disabled}
      />
    );
  }

  const interruptValue: AiInterruptPayload = content.value;
  const questions: AskQuestionItem[] =
    interruptValue.kind === "ask_user" ? interruptValue.questions : [];
  const propsAnswers =
    interruptValue.kind === "ask_user" ? interruptValue.answers : undefined;

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answers,
    answeredIds,
    setAnswer,
    jumpTo,
    goNext,
    validateAndSubmit,
    cancelAndSubmit,
    isCompleted,
    isCancelled,
  } = useInterruptForm({ questions, onSubmit, answers: propsAnswers });

  const [formState, dispatch] = useReducer(formReducer, {
    textValue: "",
    confirmValue: "",
    choiceValue: [],
    choiceOtherInput: "",
  });

  const prevIndexRef = useRef(currentIndex);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;

      if (currentQuestion) {
        const existingAnswer = answers.get(currentQuestion.id);
        if (existingAnswer) {
          if (currentQuestion.type === "text") {
            dispatch({
              type: "SET_TEXT",
              payload: existingAnswer.answer as string,
            });
          } else if (currentQuestion.type === "confirm") {
            dispatch({
              type: "SET_CONFIRM",
              payload: (existingAnswer.answer as string) || "",
            });
          } else if (currentQuestion.type === "choice") {
            const answerArray: string[] = Array.isArray(existingAnswer.answer)
              ? existingAnswer.answer.filter(
                  (value): value is string => value !== undefined,
                )
              : existingAnswer.answer
                ? [existingAnswer.answer]
                : [];
            const otherOption = (currentQuestion.options || []).find(
              (option: ChoiceOptionItem) => option.isOther,
            );

            if (otherOption && answerArray.includes(otherOption.value)) {
              const userOtherInput = answerArray.find(
                (value) => value !== otherOption.value,
              );
              dispatch({
                type: "SET_CHOICE",
                payload: answerArray,
              });
              dispatch({
                type: "SET_CHOICE_OTHER",
                payload: userOtherInput || "",
              });
            } else {
              dispatch({ type: "SET_CHOICE", payload: answerArray });
            }
          }

          return;
        }
      }

      dispatch({ type: "RESET" });
    }
  }, [currentIndex, currentQuestion, answers]);

  const handleCancel = () => {
    if (disabled) {
      return;
    }

    cancelAndSubmit();
  };

  const getCurrentAnswer = (): string | string[] => {
    if (!currentQuestion) {
      return "";
    }

    switch (currentQuestion.type) {
      case "text":
        return formState.textValue;
      case "confirm":
        return formState.confirmValue || "";
      case "choice": {
        const otherOption = (currentQuestion.options || []).find(
          (option: ChoiceOptionItem) => option.isOther,
        );
        const hasOtherSelected = formState.choiceValue.some((value) => {
          const option = (currentQuestion.options || []).find(
            (item: ChoiceOptionItem) => item.value === value,
          );
          return option?.isOther;
        });

        if (hasOtherSelected && otherOption) {
          const otherValue = otherOption.value;
          const selectedWithoutOther = formState.choiceValue.filter(
            (value) => value !== otherValue,
          );

          if (!formState.choiceOtherInput.trim()) {
            return "user rejected answer";
          }

          return [...selectedWithoutOther, formState.choiceOtherInput];
        }

        return formState.choiceValue;
      }
      default:
        return "";
    }
  };

  const saveCurrentAnswer = () => {
    if (!currentQuestion || disabled) {
      return;
    }

    const answer = getCurrentAnswer();
    const isEmptyAnswer =
      answer === "" ||
      answer === "user rejected answer" ||
      (Array.isArray(answer) && answer.length === 0);

    if (!isEmptyAnswer) {
      setAnswer(currentQuestion.id, answer);
    }
  };

  const handleJumpTo = (index: number) => {
    if (disabled) {
      return;
    }

    saveCurrentAnswer();
    jumpTo(index);
  };

  const handleNext = () => {
    if (!currentQuestion || disabled) {
      return;
    }

    saveCurrentAnswer();

    if (currentIndex === totalQuestions - 1) {
      validateAndSubmit();
    } else {
      goNext();
    }
  };

  if (isCompleted || !currentQuestion) {
    return (
      <div className={styles.container}>
        <div className={styles["summary-area"]}>
          <h3>{isCancelled ? "问题表单已取消" : "问题表单已完成"}</h3>
          {!isCancelled && (
            <ul className={styles["summary-list"]}>
              {questions.map((question) => {
                const answer = answers.get(question.id);

                return (
                  <li key={question.id} className={styles["summary-item"]}>
                    <span className={styles["summary-question"]}>
                      {question.question}
                    </span>
                    <span className={styles["summary-answer"]}>
                      {Array.isArray(answer?.answer)
                        ? answer.answer.length > 0
                          ? answer.answer.join("、")
                          : "-"
                        : answer?.answer || "-"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    );
  }

  const renderCurrentQuestion = () => {
    switch (currentQuestion.type) {
      case "text":
        return (
          <TextQuestion
            question={currentQuestion.question}
            value={formState.textValue}
            disabled={disabled}
            onChange={(value) => dispatch({ type: "SET_TEXT", payload: value })}
          />
        );
      case "confirm":
        return (
          <ConfirmQuestion
            question={currentQuestion.question}
            value={formState.confirmValue}
            disabled={disabled}
            onChange={(value) =>
              dispatch({ type: "SET_CONFIRM", payload: value })
            }
          />
        );
      case "choice":
        return (
          <ChoiceQuestion
            question={currentQuestion.question}
            options={parseOptions(currentQuestion.options)}
            value={formState.choiceValue}
            otherInput={formState.choiceOtherInput}
            disabled={disabled}
            onChange={(value) =>
              dispatch({ type: "SET_CHOICE", payload: value })
            }
            onOtherInputChange={(value) =>
              dispatch({ type: "SET_CHOICE_OTHER", payload: value })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container} role="form" aria-label="问题表单">
      <div className={styles["question-area"]}>{renderCurrentQuestion()}</div>
      <div className={styles["footer-container"]}>
        <div
          className={styles.footer}
          role="progressbar"
          aria-label={`问题进度: ${currentIndex + 1}/${totalQuestions}`}
        >
          <ProgressBar
            current={currentIndex + 1}
            total={totalQuestions}
            answeredIds={answeredIds}
            questionInfos={questions}
            onJumpTo={handleJumpTo}
          />
        </div>
        <div className={styles["footer-right"]}>
          <Button
            className={styles["default-button"]}
            onClick={handleCancel}
            disabled={disabled}
            aria-label="取消"
          >
            取消
          </Button>
          <Button
            className={styles["primary-button"]}
            onClick={handleNext}
            disabled={disabled}
            aria-label={currentIndex === totalQuestions - 1 ? "完成" : "下一个问题"}
          >
            {currentIndex === totalQuestions - 1 ? "完成" : "下一个"}
          </Button>
        </div>
      </div>
      {!disabled ? (
        <span className={styles["wait-answer"]}>SeeMind等你回答</span>
      ) : null}
    </div>
  );
};

export { AskUserInterrupt };
