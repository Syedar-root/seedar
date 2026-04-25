import React, { useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  useCreateAi,
  useDeleteAi,
  useUpdateAi,
} from "#pkg/seedar/ui-react";
import type { AiResponse } from "#pkg/seedar/types";
import { AiType } from "#pkg/seedar/types";
import { toast } from "sonner";
import { CircleHelp, Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { Select } from "@/core/components/ui/Select";
import styles from "./ModelConfigDialog.module.scss";
import type { ModelConfigDialogProps } from "./types";

const LLM_TYPE_OPTIONS = [
  { label: "OpenAI", value: "openai" },
  { label: "Anthropic", value: "anthropic" },
  { label: "DeepSeek", value: "deepseek" },
] as const;

const DEFAULT_LLM_TYPE = "deepseek";

interface ModelFormState {
  name: string;
  description: string;
  llmType: string;
  apiKey: string;
  baseUrl: string;
}

const EMPTY_FORM_STATE: ModelFormState = {
  name: "",
  description: "",
  llmType: DEFAULT_LLM_TYPE,
  apiKey: "",
  baseUrl: "",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const getStringValue = (value: unknown): string =>
  typeof value === "string" ? value : "";

const getLlmConfig = (
  config: AiResponse["config"],
): Record<string, unknown> | undefined => {
  if (!isRecord(config)) {
    return undefined;
  }

  const llmConfig = config.llm;
  return isRecord(llmConfig) ? llmConfig : undefined;
};

const buildFormState = (model?: AiResponse | null): ModelFormState => {
  const llmConfig = getLlmConfig(model?.config);
  const llmType = getStringValue(llmConfig?.type);

  return {
    name: model?.name ?? "",
    description: model?.description ?? "",
    llmType: llmType || DEFAULT_LLM_TYPE,
    apiKey: getStringValue(llmConfig?.apiKey),
    baseUrl: getStringValue(llmConfig?.baseUrl),
  };
};

const buildModelConfig = (formState: ModelFormState) => {
  const nextApiKey = formState.apiKey.trim();
  const nextBaseUrl = formState.baseUrl.trim();

  return {
    llm: {
      type: formState.llmType,
      apiKey: nextApiKey,
      ...(nextBaseUrl ? { baseUrl: nextBaseUrl } : {}),
    },
  };
};

const getBaseUrlSummary = (baseUrl: string) => {
  if (!baseUrl) {
    return "默认地址";
  }

  try {
    return new URL(baseUrl).host;
  } catch {
    return baseUrl;
  }
};

const HelpTip: React.FC<{ content: string }> = ({ content }) => {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger className={styles["help-tip-trigger"]}>
        <CircleHelp size={13} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={8}>
          <Tooltip.Popup className={styles["help-tip-popup"]}>
            {content}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
};

const ModelConfigDialog: React.FC<ModelConfigDialogProps> = ({
  open,
  models,
  currentModelId,
  onClose,
  onCurrentModelChange,
  onCreated,
  onUpdated,
  onDeleted,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>();
  const [formState, setFormState] = useState<ModelFormState>(EMPTY_FORM_STATE);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [error, setError] = useState<string>();
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  const createAiMutation = useCreateAi();
  const updateAiMutation = useUpdateAi();
  const deleteAiMutation = useDeleteAi();

  const isSaving =
    createAiMutation.isPending || updateAiMutation.isPending;
  const isDeleting = deleteAiMutation.isPending;
  const isBusy = isSaving || isDeleting;

  const selectedModel = useMemo(() => {
    if (!selectedModelId) {
      return null;
    }

    return models.find((model) => model.id === selectedModelId) || null;
  }, [models, selectedModelId]);

  const currentModelInfo = useMemo(() => {
    return models.find((model) => model.id === currentModelId) || null;
  }, [currentModelId, models]);

  const configPreview = useMemo(
    () => JSON.stringify(buildModelConfig(formState), null, 2),
    [formState],
  );

  const resetFormToCreate = () => {
    setEditorMode("create");
    setSelectedModelId(undefined);
    setFormState(EMPTY_FORM_STATE);
    setError(undefined);
    setIsDeleteConfirmVisible(false);
  };

  const loadModelToEditor = (model: AiResponse) => {
    setEditorMode("edit");
    setSelectedModelId(model.id);
    setFormState(buildFormState(model));
    setError(undefined);
    setIsDeleteConfirmVisible(false);
  };

  useEffect(() => {
    if (!open) {
      resetFormToCreate();
      return;
    }

    const initialModel =
      models.find((model) => model.id === currentModelId) || models[0];

    if (initialModel) {
      loadModelToEditor(initialModel);
      return;
    }

    resetFormToCreate();
  }, [open]);

  useEffect(() => {
    if (!open || !selectedModelId) {
      return;
    }

    const matchedModel = models.find((model) => model.id === selectedModelId);

    if (matchedModel) {
      return;
    }

    const fallbackModel =
      models.find((model) => model.id === currentModelId) || models[0];

    if (fallbackModel) {
      loadModelToEditor(fallbackModel);
      return;
    }

    resetFormToCreate();
  }, [currentModelId, models, open, selectedModelId]);

  useEffect(() => {
    if (!open || selectedModelId || editorMode !== "create") {
      return;
    }

    if (formState.name || formState.apiKey || models.length === 0) {
      return;
    }

    const initialModel =
      models.find((model) => model.id === currentModelId) || models[0];

    if (initialModel) {
      loadModelToEditor(initialModel);
    }
  }, [
    currentModelId,
    editorMode,
    formState.apiKey,
    formState.name,
    models,
    open,
    selectedModelId,
  ]);

  const validateForm = () => {
    if (!formState.name.trim()) {
      return "请输入模型名称";
    }

    if (!formState.apiKey.trim()) {
      return "请输入 API Key";
    }

    if (!formState.llmType.trim()) {
      return "请选择消息规格";
    }

    return undefined;
  };

  const handleFieldChange = (
    key: keyof ModelFormState,
    value: ModelFormState[keyof ModelFormState],
  ) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
    setError(undefined);
  };

  const handleSubmit = () => {
    const nextError = validateForm();
    setError(nextError);

    if (nextError) {
      return;
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim() || undefined,
      config: buildModelConfig(formState),
    };

    if (editorMode === "create") {
      createAiMutation.mutate(
        {
          ...payload,
          type: AiType.CHAT,
        },
        {
          onSuccess: (createdModel) => {
            toast.success("模型已创建");
            onCreated?.(createdModel);
            onCurrentModelChange?.(createdModel.id);
            loadModelToEditor(createdModel);
          },
          onError: (requestError) => {
            setError(requestError.message || "创建失败，请稍后重试");
          },
        },
      );
      return;
    }

    if (!selectedModel) {
      setError("未找到可编辑的模型");
      return;
    }

    updateAiMutation.mutate(
      {
        id: selectedModel.id,
        ...payload,
      },
      {
        onSuccess: (updatedModel) => {
          toast.success("模型已更新");
          onUpdated?.(updatedModel);
          loadModelToEditor(updatedModel);
        },
        onError: (requestError) => {
          setError(requestError.message || "保存失败，请稍后重试");
        },
      },
    );
  };

  const handleDelete = () => {
    if (!selectedModel) {
      setError("未找到可删除的模型");
      return;
    }

    deleteAiMutation.mutate(selectedModel.id, {
      onSuccess: () => {
        toast.success("模型已删除");
        onDeleted?.(selectedModel.id);

        const remainingModels = models.filter(
          (model) => model.id !== selectedModel.id,
        );
        const nextModel = remainingModels[0];

        if (currentModelId === selectedModel.id && nextModel) {
          onCurrentModelChange?.(nextModel.id);
        }

        if (currentModelId === selectedModel.id && !nextModel) {
          onCurrentModelChange?.("");
        }

        if (nextModel) {
          loadModelToEditor(nextModel);
          return;
        }

        resetFormToCreate();
      },
      onError: (requestError) => {
        setError(requestError.message || "删除失败，请稍后重试");
      },
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.backdrop} />
        <Dialog.Popup className={styles.popup}>
          <Tooltip.Provider>
            <div className={styles.content}>
              <div className={styles.header}>
                <div className={styles["title-row"]}>
                  <Dialog.Title className={styles.title}>
                    模型管理
                  </Dialog.Title>
                  <div className={styles["header-meta"]}>
                    <span className={styles["header-chip"]}>
                      {models.length} 个模型
                    </span>
                    {currentModelInfo ? (
                      <span className={styles["header-chip-muted"]}>
                        当前：{currentModelInfo.name}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={styles.layout}>
                <section className={styles["list-panel"]}>
                  <div className={styles["panel-header"]}>
                    <div className={styles["panel-heading"]}>
                      <h3 className={styles["panel-title"]}>已添加模型</h3>
                      <HelpTip content="点击卡片进入编辑，卡片底部可以直接将模型设为当前。" />
                    </div>
                    <button
                      type="button"
                      className={styles["ghost-button"]}
                      onClick={resetFormToCreate}
                      disabled={isBusy}
                    >
                      <Plus size={14} />
                      <span>新建</span>
                    </button>
                  </div>

                  <div className={styles["list-container"]}>
                    <ScrollArea>
                      <div className={styles["model-list"]}>
                        {models.length > 0 ? (
                          models.map((model) => {
                            const isSelected = model.id === selectedModelId;
                            const isCurrent = model.id === currentModelId;
                            const llmType =
                              getStringValue(getLlmConfig(model.config)?.type) ||
                              DEFAULT_LLM_TYPE;
                            const baseUrlSummary = getBaseUrlSummary(
                              getStringValue(getLlmConfig(model.config)?.baseUrl),
                            );

                            return (
                              <div
                                key={model.id}
                                className={styles["model-card"]}
                                data-active={isSelected || undefined}
                              >
                                <button
                                  type="button"
                                  className={styles["model-card-main"]}
                                  onClick={() => loadModelToEditor(model)}
                                >
                                  <div className={styles["model-card-header"]}>
                                    <span className={styles["model-card-title"]}>
                                      {model.name}
                                    </span>
                                    <div className={styles["model-card-badges"]}>
                                      {isCurrent ? (
                                        <span
                                          className={styles["model-badge-current"]}
                                        >
                                          当前
                                        </span>
                                      ) : null}
                                      <span className={styles["model-badge-type"]}>
                                        {llmType}
                                      </span>
                                    </div>
                                  </div>
                                  {model.description ? (
                                    <div
                                      className={styles["model-card-description"]}
                                    >
                                      {model.description}
                                    </div>
                                  ) : null}
                                  <div className={styles["model-card-footer"]}>
                                    <span className={styles["model-card-meta"]}>
                                      {baseUrlSummary}
                                    </span>
                                  </div>
                                </button>
                                {!isCurrent ? (
                                  <button
                                    type="button"
                                    className={styles["model-card-action-button"]}
                                    onClick={() => onCurrentModelChange?.(model.id)}
                                  >
                                    设为当前
                                  </button>
                                ) : null}
                              </div>
                            );
                          })
                        ) : (
                          <div className={styles["empty-state"]}>
                            还没有可用模型
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </section>

                <section className={styles["editor-panel"]}>
                  <div className={styles["panel-header"]}>
                    <div className={styles["panel-heading"]}>
                      <h3 className={styles["panel-title"]}>
                        {editorMode === "create" ? "新建模型" : "编辑模型"}
                      </h3>
                      <HelpTip content="这里编辑的是 config.llm；提交后会写入模型的 Config 字段。" />
                    </div>
                    {editorMode === "edit" && selectedModel ? (
                      <span className={styles["panel-tag"]}>
                        {selectedModel.name}
                      </span>
                    ) : null}
                  </div>

                  <div className={styles["editor-body"]}>
                    <div className={styles["field-grid-single"]}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="model-name">
                          <span>模型名称</span>
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          id="model-name"
                          className={styles.input}
                          value={formState.name}
                          onChange={(event) =>
                            handleFieldChange("name", event.target.value)
                          }
                          placeholder="例如：默认对话模型"
                        />
                      </div>
                    </div>

                    <div className={styles["field-grid"]}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          <span>消息规格</span>
                          <HelpTip content="决定 config.llm.type，仅支持 openai、anthropic、deepseek 三种。" />
                        </label>
                        <Select
                          value={formState.llmType}
                          clearable={false}
                          options={[...LLM_TYPE_OPTIONS]}
                          onChange={(value) =>
                            handleFieldChange(
                              "llmType",
                              value || DEFAULT_LLM_TYPE,
                            )
                          }
                          placeholder="选择消息规格"
                        />
                      </div>

                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="model-base-url">
                          <span>Base URL</span>
                          <HelpTip content="可选；留空时使用服务端或默认配置。" />
                        </label>
                        <input
                          id="model-base-url"
                          className={styles.input}
                          value={formState.baseUrl}
                          onChange={(event) =>
                            handleFieldChange("baseUrl", event.target.value)
                          }
                          placeholder="例如：https://api.minimaxi.com/anthropic"
                        />
                      </div>
                    </div>

                    <div className={styles["field-grid-single"]}>
                      <div className={styles.field}>
                        <label className={styles.label} htmlFor="model-api-key">
                          <span>API Key</span>
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          id="model-api-key"
                          type="password"
                          className={styles.input}
                          value={formState.apiKey}
                          onChange={(event) =>
                            handleFieldChange("apiKey", event.target.value)
                          }
                          placeholder="请输入 API Key"
                        />
                      </div>
                    </div>

                    <div className={styles["field-grid-single"]}>
                      <div className={styles.field}>
                        <label
                          className={styles.label}
                          htmlFor="model-description"
                        >
                          <span>说明</span>
                        </label>
                        <textarea
                          id="model-description"
                          className={styles.textarea}
                          value={formState.description}
                          onChange={(event) =>
                            handleFieldChange("description", event.target.value)
                          }
                          placeholder="可选"
                        />
                      </div>
                    </div>

                    <div className={styles["field-grid-single"]}>
                      <div className={styles.field}>
                        <label className={styles.label}>
                          <span>配置预览</span>
                          <HelpTip content="提交前将写入 Config 的实际内容。" />
                        </label>
                        <pre className={styles["config-preview"]}>
                          {configPreview}
                        </pre>
                      </div>
                    </div>

                    {error ? (
                      <div className={styles["error-text"]}>{error}</div>
                    ) : null}
                  </div>

                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles["secondary-button"]}
                      onClick={onClose}
                      disabled={isBusy}
                    >
                      关闭
                    </button>

                    <div className={styles["actions-right"]}>
                      {editorMode === "edit" ? (
                        isDeleteConfirmVisible ? (
                          <>
                            <button
                              type="button"
                              className={styles["secondary-button"]}
                              onClick={() => setIsDeleteConfirmVisible(false)}
                              disabled={isBusy}
                            >
                              取消删除
                            </button>
                            <button
                              type="button"
                              className={styles["danger-button"]}
                              onClick={handleDelete}
                              disabled={isBusy}
                            >
                              {isDeleting ? "删除中..." : "确认删除"}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className={styles["ghost-danger-button"]}
                            onClick={() => setIsDeleteConfirmVisible(true)}
                            disabled={isBusy}
                          >
                            <Trash2 size={14} />
                            <span>删除</span>
                          </button>
                        )
                      ) : null}

                      <button
                        type="button"
                        className={styles["primary-button"]}
                        onClick={handleSubmit}
                        disabled={isBusy}
                      >
                        {isSaving
                          ? editorMode === "create"
                            ? "创建中..."
                            : "保存中..."
                          : editorMode === "create"
                            ? "创建模型"
                            : "保存修改"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </Tooltip.Provider>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ModelConfigDialog;
