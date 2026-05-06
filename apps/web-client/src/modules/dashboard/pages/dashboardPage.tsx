import { useCallback, useMemo, useState } from "react";
import { SeedarDashboard } from "#pkg/seedar/ui-react";
import styles from "./styles/dashboard.module.scss";
import {
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Copy,
  Check,
  X,
  Plus,
  PanelTop,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Empty } from "@/core/components/ui/Empty";
import { DashboardAside } from "../components/aside";
import { useDashboard, useUpdateDashboard } from "#pkg/seedar/ui-react";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"edit" | "view">("view");
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  const { dashboardId } = useParams();
  const { data: dashboard } = useDashboard(dashboardId || "");
  const { mutate: updateDashboard } = useUpdateDashboard();

  const handlePanelClick = useCallback(
    (panelId: string) => {
      navigate(`/panel/${panelId}`);
    },
    [navigate],
  );

  const handleCreatePanelClick = useCallback(() => {
    navigate("/panel");
  }, [navigate]);

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "edit" ? "view" : "edit"));
  }, []);

  const handleEditName = useCallback(() => {
    setEditingName(dashboard?.name || "");
    setIsEditing(true);
  }, [dashboard?.name]);

  const handleSaveName = useCallback(() => {
    if (dashboardId && editingName.trim()) {
      updateDashboard(
        { id: dashboardId, data: { name: editingName.trim() } },
        {
          onSuccess: () => {
            setIsEditing(false);
          },
        },
      );
    }
  }, [dashboardId, editingName, updateDashboard]);

  const handleCancelEdit = useCallback(() => {
    setEditingName(dashboard?.name || "");
    setIsEditing(false);
  }, [dashboard?.name]);

  const handleCopyId = useCallback(async () => {
    if (dashboardId) {
      try {
        await navigator.clipboard.writeText(dashboardId);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  }, [dashboardId]);

  const header = useMemo(() => {
    return (
      <div className={styles.header}>
        <div className={styles.modeSwitch} role="group" aria-label="看板模式">
          <button
            className={mode === "view" ? styles.modeActive : undefined}
            onClick={mode === "view" ? undefined : toggleMode}
            type="button"
          >
            <Eye size={16} />
            <span>浏览</span>
          </button>
          <button
            className={mode === "edit" ? styles.modeActive : undefined}
            onClick={mode === "edit" ? undefined : toggleMode}
            type="button"
          >
            <Edit size={16} />
            <span>编辑</span>
          </button>
        </div>
        {mode === "edit" && (
          <div className={styles.headerActions}>
            <SeedarDashboard.AddPanelTrigger>
              <button className={styles.addPanel} type="button">
                <PanelTop size={16} />
                <span>添加已有面板</span>
              </button>
            </SeedarDashboard.AddPanelTrigger>
            <button
              className={styles.createPanel}
              onClick={handleCreatePanelClick}
              type="button"
            >
              <Plus size={16} />
              <span>新建面板</span>
            </button>
          </div>
        )}
      </div>
    );
  }, [handleCreatePanelClick, mode, toggleMode]);

  const panelHeaderExtra = useCallback(
    (panelId: string) => {
      return (
        <div className={styles.panelHeaderExtra}>
          <ExternalLink size={16} onClick={() => handlePanelClick(panelId)} />
          {mode === "edit" && (
            <SeedarDashboard.RemovePanelTrigger panelId={panelId}>
              <Trash2 size={16} color="#fa2929" />
            </SeedarDashboard.RemovePanelTrigger>
          )}
        </div>
      );
    },
    [handlePanelClick, mode],
  );

  return (
    <div className={styles.container}>
      <DashboardAside />
      <main className={styles.main}>
        {dashboardId ? (
          <>
            {dashboard && (
              <div className={styles.dashboardInfo}>
                <div className={styles.dashboardInfoHeader}>
                  <div className={styles.dashboardName}>
                    {isEditing ? (
                      <div className={styles.nameEditForm}>
                        <input
                          type="text"
                          className={`${styles.nameInput} ${styles.editing}`}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveName();
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className={styles.editActions}>
                          <button
                            className={styles.saveButton}
                            onClick={handleSaveName}
                            title="保存"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            className={styles.cancelButton}
                            onClick={handleCancelEdit}
                            title="取消"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className={styles.dashboardNameValue}>
                          {dashboard.name || "未命名看板"}
                        </span>
                        <button
                          className={styles.editButton}
                          onClick={handleEditName}
                          title="编辑名称"
                        >
                          <Edit size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  <div className={styles.dashboardId}>
                    <span className={styles.dashboardIdLabel}>ID:</span>
                    <span className={styles.dashboardIdValue}>
                      {dashboardId}
                    </span>
                    <button
                      className={styles.copyButton}
                      onClick={handleCopyId}
                      title={copySuccess ? "已复制" : "复制 ID"}
                    >
                      {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <SeedarDashboard
              autoUpdate={true}
              dashboardId={dashboardId}
              mode={mode}
              header={header}
              panelHeaderExtra={panelHeaderExtra}
            ></SeedarDashboard>
          </>
        ) : (
          <Empty size="fill" description="请选择一个看板" />
        )}
      </main>
    </div>
  );
};
