import React, { useReducer, useEffect, useRef } from "react";
import { Button } from "@base-ui/react/button";
import { Input } from "@base-ui/react/input";
import type {
  InterruptMessageProps,
  AskQuestionItem,
  ChoiceOptionItem,
} from "../../types";
import {
  useInterruptForm,
  parseOptions,
} from "../../hooks/useInterruptForm.hook";
import {
  ProgressBar,
  TextQuestion,
  ConfirmQuestion,
  ChoiceQuestion,
} from "./components";
import styles from "./InterruptMessage.module.scss";

interface FormState {
  textValue: string;
  confirmValue: string | undefined;
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
        confirmValue: undefined,
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

const InterruptMessage: React.FC<InterruptMessageProps> = ({
  content,
  onSubmit,
  disabled = false,
}) => {
  console.log("content", content);
  const questions: AskQuestionItem[] =
    typeof content === "string" ? [] : content.value.questions;
  const propsAnswers =
    typeof content === "string" ? undefined : content.value.answers;

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answers,
    answeredIds,
    jumpTo,
    goNext,
    validateAndSubmit,
    isCompleted,
  } = useInterruptForm({ questions, onSubmit, answers: propsAnswers });

  const [formState, dispatch] = useReducer(formReducer, {
    textValue: "",
    confirmValue: undefined,
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
              payload: existingAnswer.answer as string,
            });
          } else if (currentQuestion.type === "choice") {
            const answerArray = Array.isArray(existingAnswer.answer)
              ? existingAnswer.answer
              : [existingAnswer.answer];
            const otherOption = (currentQuestion.options || []).find(
              (opt: ChoiceOptionItem) => opt.isOther,
            );
            if (otherOption && answerArray.includes(otherOption.value)) {
              const userOtherInput = answerArray.find(
                (v) => v !== otherOption.value,
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
    onSubmit?.("user reject answer", true);
  };

  const handleNext = () => {
    if (!currentQuestion) return;

    const existingAnswer = answers.get(currentQuestion.id);
    if (!existingAnswer) {
      let answer: string | string[] = "";
      switch (currentQuestion.type) {
        case "text": {
          answer = formState.textValue;
          break;
        }
        case "confirm": {
          answer = formState.confirmValue || "";
          break;
        }
        case "choice": {
          const otherOption = (currentQuestion.options || []).find(
            (opt: ChoiceOptionItem) => opt.isOther,
          );
          const hasOtherSelected = formState.choiceValue.some((v) => {
            const option = (currentQuestion.options || []).find(
              (opt: ChoiceOptionItem) => opt.value === v,
            );
            return option?.isOther;
          });

          if (hasOtherSelected && otherOption) {
            const otherValue = otherOption.value;
            const selectedWithoutOther = formState.choiceValue.filter(
              (v) => v !== otherValue,
            );
            if (!formState.choiceOtherInput.trim()) {
              answer = "user rejected answer";
            } else {
              answer = [...selectedWithoutOther, formState.choiceOtherInput];
            }
          } else {
            answer = formState.choiceValue;
          }
          break;
        }
      }
      answers.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        question: currentQuestion.question,
        answer,
      });
    }

    if (currentIndex === totalQuestions - 1) {
      validateAndSubmit();
    } else {
      goNext();
    }
  };

  if (typeof content === "string") {
    return (
      <div className={styles["container"]}>
        <div className={styles["header"]}>{content}</div>
        <div className={styles["input-row"]}>
          <Input
            value={formState.textValue}
            onValueChange={(val) =>
              dispatch({ type: "SET_TEXT", payload: val })
            }
            onKeyDown={(e) => {
              if (e.key === "Enter" && formState.textValue.trim()) {
                onSubmit?.(
                  `user answer: ${JSON.stringify({
                    questionId: "text",
                    question: content,
                    answer: formState.textValue,
                  })}`,
                  true,
                );
              }
            }}
            placeholder="请输入..."
            className={styles["input-field"]}
          />
          <Button
            className={styles["primary-button"]}
            onClick={() => {
              if (formState.textValue.trim()) {
                onSubmit?.(
                  `user answer: ${JSON.stringify({
                    questionId: "text",
                    question: content,
                    answer: formState.textValue,
                  })}`,
                  true,
                );
              }
            }}
          >
            确认
          </Button>
        </div>
      </div>
    );
  }

  if (isCompleted || !currentQuestion) {
    console.log("answers", answers);
    return (
      <div className={styles["container"]}>
        <div className={styles["summary-area"]}>
          <h3>问题表单已完成</h3>
          <ul className={styles["summary-list"]}>
            {questions.map((q) => {
              const answer = answers.get(q.id);
              return (
                <li key={q.id} className={styles["summary-item"]}>
                  <span className={styles["summary-question"]}>
                    {q.question}
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
            onChange={(val) => dispatch({ type: "SET_TEXT", payload: val })}
          />
        );
      case "confirm":
        return (
          <ConfirmQuestion
            question={currentQuestion.question}
            value={formState.confirmValue}
            onChange={(val) => dispatch({ type: "SET_CONFIRM", payload: val })}
          />
        );
      case "choice":
        return (
          <ChoiceQuestion
            question={currentQuestion.question}
            options={parseOptions(currentQuestion.options)}
            value={formState.choiceValue}
            otherInput={formState.choiceOtherInput}
            onChange={(val) => dispatch({ type: "SET_CHOICE", payload: val })}
            onOtherInputChange={(val) =>
              dispatch({ type: "SET_CHOICE_OTHER", payload: val })
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles["container"]} role="form" aria-label="问题表单">
      <div className={styles["question-area"]}>{renderCurrentQuestion()}</div>
      <div className={styles["footer-container"]}>
        <div
          className={styles["footer"]}
          role="progressbar"
          aria-label={`问题进度: ${currentIndex + 1}/${totalQuestions}`}
        >
          <ProgressBar
            current={currentIndex + 1}
            total={totalQuestions}
            answeredIds={answeredIds}
            questionInfos={questions}
            onJumpTo={jumpTo}
          />
        </div>
        <div className={styles["footer-right"]}>
          <Button
            className={styles["default-button"]}
            onClick={handleCancel}
            aria-label="取消"
          >
            取消
          </Button>
          <Button
            className={styles["primary-button"]}
            onClick={handleNext}
            aria-label={
              currentIndex === totalQuestions - 1 ? "完成" : "下一个问题"
            }
          >
            {currentIndex === totalQuestions - 1 ? "完成" : "下一个"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InterruptMessage;
