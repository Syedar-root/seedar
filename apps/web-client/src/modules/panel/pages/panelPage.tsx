import { MetricCard, SeedarPanel } from "#pkg/seedar/ui-react";
import { Dialog } from "@base-ui/react/dialog";
import { Segmented } from "antd";
import { Aside } from "../components/aside";
import { DatasetSelector } from "../components/datasetSelector";
import datasetSelectorStyles from "../components/datasetSelector/datasetSelector.module.scss";
import { EditableTitle } from "../components/editableTitle";
import { PanelEditor } from "../components/panelEditor";
import { QueryZone } from "../components/queryZone/queryZone";
import { usePanelPageViewModel } from "../hooks";
import styles from "./styles/panel.module.scss";

export const PanelPage = () => {
  const {
    containerRef,
    layout,
    header,
    actions,
    workflowConfirm,
    preview,
    copy,
    asideProps,
    panelEditorProps,
    queryZoneProps,
    datasetDialog,
  } = usePanelPageViewModel();

  const asideContent = <Aside {...asideProps} />;
  const editorContent = <PanelEditor {...panelEditorProps} />;

  return (
    <div ref={containerRef} className={styles.container}>
      {layout.mode === "expanded" ? (
        <>
          <aside className={styles.sidebar}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>{copy.sideFields}</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => layout.handleCollapse("aside")}
              >
                {copy.collapse}
              </button>
            </div>
            <div className={styles.sideContent}>{asideContent}</div>
          </aside>
          <aside className={styles.editor}>
            <div className={styles.sideHeader}>
              <span className={styles.sideTitle}>{copy.sideEditor}</span>
              <button
                type="button"
                className={styles.sideAction}
                onClick={() => layout.handleCollapse("editor")}
              >
                {copy.collapse}
              </button>
            </div>
            <div className={styles.sideContent}>{editorContent}</div>
          </aside>
        </>
      ) : layout.mode === "collapsed" ? (
        <aside className={styles.collapsedPane}>
          <div className={styles.collapsedSwitchWrap}>
            {layout.canExpand ? (
              <button
                type="button"
                className={styles.expandAction}
                onClick={layout.handleExpand}
              >
                {copy.expand}
              </button>
            ) : null}
            <Segmented
              block
              value={layout.activePane}
              onChange={layout.handlePaneChange}
              options={[
                { label: copy.sideFields, value: "aside" },
                { label: copy.sideEditor, value: "editor" },
              ]}
            />
            {layout.showCollapsedClose ? (
              <button
                type="button"
                className={styles.closeRailAction}
                onClick={layout.handleCloseToRail}
              >
                {copy.collapse}
              </button>
            ) : null}
          </div>
          <div className={styles.collapsedContent}>
            {layout.activePane === "aside" ? asideContent : editorContent}
          </div>
        </aside>
      ) : (
        <aside className={styles.fullCollapsedRail}>
          <button
            type="button"
            className={styles.railButton}
            onClick={layout.handleOpenFromRail}
            aria-label={copy.railOpen}
            title={copy.railOpen}
          >
            <span className={styles.railButtonIcon} aria-hidden="true">
              {"<"}
            </span>
          </button>
        </aside>
      )}

      <main className={styles.main}>
        <header className={styles.mainHeader}>
          <div className={styles.titleArea}>
            <div className={styles.titleMeta}>
              <EditableTitle {...header.titleProps} />
              <span className={styles.statusBadge}>{header.panelStatusLabel}</span>
            </div>
          </div>

          <QueryZone {...queryZoneProps} />

          <div className={styles.operations}>
            <button
              className={styles.save}
              onClick={actions.onPrimarySave}
              disabled={actions.isPrimaryDisabled}
            >
              {header.primaryActionLabel}
            </button>
            {header.isPublished ? (
              <button
                className={styles.secondaryAction}
                onClick={actions.onRevertToDraft}
                disabled={actions.isRevertDisabled}
              >
                撤销为草稿
              </button>
            ) : null}
            <button
              className={styles.run}
              onClick={actions.onRun}
              disabled={actions.isRunDisabled}
            >
              运行
            </button>
            <button
              className={styles.secondaryAction}
              onClick={actions.onCopySql}
              disabled={actions.isCopySqlDisabled}
            >
              复制 SQL
            </button>
          </div>
        </header>

        {workflowConfirm.visible ? (
          <section
            className={styles.workflowConfirmBanner}
            aria-live="polite"
            aria-label={workflowConfirm.bannerLabel}
          >
            <div className={styles.workflowConfirmCopy}>
              <div className={styles.workflowConfirmEyebrow}>
                {workflowConfirm.bannerLabel}
              </div>
              <div className={styles.workflowConfirmTitle}>
                {workflowConfirm.bannerTitle}
              </div>
              <div className={styles.workflowConfirmDesc}>
                {workflowConfirm.bannerDescription}
              </div>
            </div>
            <div className={styles.workflowConfirmActions}>
              <button
                className={styles.workflowDiscardAction}
                onClick={workflowConfirm.onDiscard}
                disabled={workflowConfirm.isActionDisabled}
              >
                {workflowConfirm.discardLabel}
              </button>
              <button
                className={styles.workflowAcceptAction}
                onClick={workflowConfirm.onAccept}
                disabled={workflowConfirm.isActionDisabled}
              >
                {workflowConfirm.acceptLabel}
              </button>
            </div>
          </section>
        ) : null}

        <main className={styles.mainContent}>
          {preview.panel ? (
            preview.displayType === "card" ? (
              <div className={styles.cardPreviewShell}>
                <MetricCard
                  className={styles.cardPreviewCard}
                  queryId={preview.panel.queryId}
                  data={preview.tempData}
                  formatting={preview.formatting}
                  config={preview.cardConfig}
                />
              </div>
            ) : (
              <SeedarPanel
                showHeader={false}
                panelId={preview.panelId ?? preview.panel.id}
                data={preview.tempData}
                panel={preview.panel}
              />
            )
          ) : (
            <div className={styles.previewEmpty}>{preview.emptyText}</div>
          )}
        </main>
      </main>

      <Dialog.Root
        open={datasetDialog.open}
        onOpenChange={datasetDialog.onOpenChange}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className={datasetSelectorStyles.dialogBackdrop} />
          <Dialog.Popup className={datasetSelectorStyles.dialogPopup}>
            <DatasetSelector {...datasetDialog.selectorProps} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};
