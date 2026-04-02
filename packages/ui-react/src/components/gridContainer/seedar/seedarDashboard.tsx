import { GridContainer } from "../gridContainter";
import { SeedarPanel } from "./seedarPanel";
import { SeedarDashboardContext } from "./seedarDashboardContext";
import {
  Triggers,
  SaveTrigger,
  CancelTrigger,
  AddPanelTrigger,
  RemovePanelTrigger,
  DefaultAddPanelDialog,
} from "./seedarDashboardTriggers";
import { useDashboardActions } from "../../../hooks";
import type { Layouts } from "#pkg/seedar/types";
import { useEffect } from "react";
import { ScrollArea } from "../../common/ScrollArea";

interface SeedarDashboardProps {
  dashboardId: string;
  mode?: "edit" | "view";
  autoUpdate?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  panelHeaderExtra?: (panelId: string) => React.ReactNode;
}

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
  const { data, actions, state } = useDashboardActions(dashboardId, autoUpdate);

  if (state.isLoading || state.isError || !data) {
    return null;
  }

  const handleLayoutChange = (newLayouts: Layouts) => {
    actions.updateLayout(newLayouts);
  };

  return (
    <SeedarDashboardContext.Provider
      value={{ dashboardId, data, actions, state, mode }}
    >
      {header}
      {children}
      <ScrollArea style={{ paddingBottom: "2rem" }}>
        <GridContainer
          key={dashboardId}
          layouts={state.localLayout}
          onLayoutChange={handleLayoutChange}
          mode={mode}
        >
          {data.panels.map((panel) => (
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
    </SeedarDashboardContext.Provider>
  );
};

SeedarDashboard.Triggers = Triggers;
SeedarDashboard.SaveTrigger = SaveTrigger;
SeedarDashboard.CancelTrigger = CancelTrigger;
SeedarDashboard.AddPanelTrigger = AddPanelTrigger;
SeedarDashboard.RemovePanelTrigger = RemovePanelTrigger;
SeedarDashboard.DefaultAddPanelDialog = DefaultAddPanelDialog;
