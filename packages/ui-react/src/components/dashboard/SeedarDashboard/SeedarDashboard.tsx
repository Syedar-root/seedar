import { GridContainer } from "../../layout/GridContainer";
import { SeedarPanel } from "../SeedarPanel";
import { SeedarDashboardContext } from "./context/SeedarDashboardContext";
import { LayoutEditorToolbar } from "./components/LayoutEditorToolbar";
import { useSeedarDashboardController } from "./hooks/useSeedarDashboardController.hook";
import {
  Triggers,
  SaveTrigger,
  CancelTrigger,
  AddPanelTrigger,
  RemovePanelTrigger,
  DefaultAddPanelDialog,
} from "./SeedarDashboardTriggers";
import { ScrollArea } from "../../layout/ScrollArea";
import styles from "./SeedarDashboard.module.css";
import tokenStyles from "./SeedarDashboard.tokens.module.css";
import type { SeedarDashboardProps } from "./types";

export const SeedarDashboard: React.FC<SeedarDashboardProps> & {
  Triggers: typeof Triggers;
  SaveTrigger: typeof SaveTrigger;
  CancelTrigger: typeof CancelTrigger;
  AddPanelTrigger: typeof AddPanelTrigger;
  RemovePanelTrigger: typeof RemovePanelTrigger;
  DefaultAddPanelDialog: typeof DefaultAddPanelDialog;
} = ({
  dashboardId,
  mode = "edit",
  autoUpdate = false,
  header,
  children,
  footer,
  panelHeaderExtra,
}) => {
  const controller = useSeedarDashboardController({
    dashboardId,
    autoUpdate,
    mode,
  });

  if (!controller.isReady || !controller.contextValue || !controller.gridContainerProps) {
    return null;
  }

  return (
    <SeedarDashboardContext.Provider
      value={controller.contextValue}
    >
      <div className={`${tokenStyles["token-scope"]} ${styles.seedarDashboard}`}>
        {header}
        <LayoutEditorToolbar />
        {children}
        <ScrollArea
          className={styles.dashboardScroll}
          contentClassName={styles.dashboardScrollContent}
        >
          <GridContainer key={dashboardId} {...controller.gridContainerProps}>
            {controller.contextValue.data?.panels.map((panel) => (
              <SeedarPanel
                key={panel.id}
                panelId={panel.id}
                panel={panel}
                headerExtra={panelHeaderExtra}
              />
            ))}
          </GridContainer>
        </ScrollArea>
        {footer}
      </div>
    </SeedarDashboardContext.Provider>
  );
};

SeedarDashboard.Triggers = Triggers;
SeedarDashboard.SaveTrigger = SaveTrigger;
SeedarDashboard.CancelTrigger = CancelTrigger;
SeedarDashboard.AddPanelTrigger = AddPanelTrigger;
SeedarDashboard.RemovePanelTrigger = RemovePanelTrigger;
SeedarDashboard.DefaultAddPanelDialog = DefaultAddPanelDialog;
