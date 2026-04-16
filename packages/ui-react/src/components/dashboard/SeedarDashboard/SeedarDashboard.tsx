import { GridContainer } from "../../layout/GridContainer";
import { SeedarPanel } from "../SeedarPanel";
import { SeedarDashboardContext } from "./context/SeedarDashboardContext";
import { LayoutEditorToolbar } from "./components/LayoutEditorToolbar";
import {
  Triggers,
  SaveTrigger,
  CancelTrigger,
  AddPanelTrigger,
  RemovePanelTrigger,
  DefaultAddPanelDialog,
} from "./SeedarDashboardTriggers";
import { useDashboardActions } from "../../../hooks";
import type { Layouts } from "#pkg/seedar/types";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollArea } from "../../layout/ScrollArea";
import styles from "./SeedarDashboard.module.css";
import type {
  AddPanelScope,
  SeedarBreakpoint,
} from "../../../utils/dashboard-layout/constants";
import { BREAKPOINT_ORDER } from "../../../utils/dashboard-layout/constants";
import {
  copyBreakpointLayout,
  findNearestConfiguredBreakpoint,
  getConfiguredBreakpoints,
  getDefaultLockedCanvasWidth,
  resolvePanelTargetBreakpoints,
} from "../../../utils/dashboard-layout/layoutEditor";

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
  const {
    data,
    actions: dashboardActions,
    state: dashboardState,
  } = useDashboardActions(dashboardId, autoUpdate);
  const [activeBreakpoint, setActiveBreakpoint] =
    useState<SeedarBreakpoint>("lg");
  const [lockedCanvasWidth, setLockedCanvasWidth] = useState(
    getDefaultLockedCanvasWidth("lg"),
  );
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerBreakpoint, setContainerBreakpoint] =
    useState<SeedarBreakpoint>("lg");
  const [effectiveGridWidth, setEffectiveGridWidth] = useState(
    getDefaultLockedCanvasWidth("lg"),
  );
  const hasEditedBreakpointRef = useRef(false);
  const configuredBreakpoints = useMemo(
    () => getConfiguredBreakpoints(dashboardState.localLayout),
    [dashboardState.localLayout],
  );
  const activeBreakpointSource = useMemo(
    () =>
      findNearestConfiguredBreakpoint(dashboardState.localLayout, activeBreakpoint),
    [activeBreakpoint, dashboardState.localLayout],
  );
  const effectiveActiveBreakpoint =
    mode === "view" ? containerBreakpoint : activeBreakpoint;

  useEffect(() => {
    hasEditedBreakpointRef.current = false;
  }, [dashboardId]);

  useEffect(() => {
    if (!hasEditedBreakpointRef.current && containerWidth > 0) {
      setActiveBreakpoint(containerBreakpoint);
      setLockedCanvasWidth(getDefaultLockedCanvasWidth(containerBreakpoint));
    }
  }, [containerBreakpoint, containerWidth]);

  if (dashboardState.isLoading || dashboardState.isError || !data) {
    return null;
  }

  const handleLayoutChange = (newLayouts: Layouts) => {
    dashboardActions.updateLayout(newLayouts);
  };

  const handleAddPanel = (
    panelId: string,
    options?: {
      defaultSize?: { w: number; h: number };
      scope?: AddPanelScope;
    },
  ) => {
    dashboardActions.addPanel(panelId, {
      defaultSize: options?.defaultSize,
      targetBreakpoints: resolvePanelTargetBreakpoints({
        scope: options?.scope || "active",
        activeBreakpoint: effectiveActiveBreakpoint,
        configuredBreakpoints,
      }),
    });
  };

  const handleCopyActiveBreakpointToOthers = () => {
    dashboardActions.updateLayout(
      copyBreakpointLayout(
        dashboardState.localLayout,
        effectiveActiveBreakpoint,
        BREAKPOINT_ORDER.filter(
          (breakpoint) => breakpoint !== effectiveActiveBreakpoint,
        ),
      ),
    );
  };

  const actions = {
    ...dashboardActions,
    addPanel: handleAddPanel,
    setActiveBreakpoint: (breakpoint: SeedarBreakpoint) => {
      hasEditedBreakpointRef.current = true;
      setActiveBreakpoint(breakpoint);
      setLockedCanvasWidth(getDefaultLockedCanvasWidth(breakpoint));
    },
    setLockedCanvasWidth,
    copyActiveBreakpointToOthers: handleCopyActiveBreakpointToOthers,
  };

  const state = {
    ...dashboardState,
    activeBreakpoint: effectiveActiveBreakpoint,
    containerBreakpoint,
    containerWidth,
    effectiveGridWidth,
    lockedCanvasWidth,
    configuredBreakpoints,
    activeBreakpointSource,
  };

  return (
    <SeedarDashboardContext.Provider
      value={{ dashboardId, data, actions, state, mode }}
    >
      <div className={styles.seedarDashboard}>
        {header}
        <LayoutEditorToolbar />
        {children}
        <ScrollArea style={{ paddingBottom: "2rem" }}>
          <GridContainer
            key={dashboardId}
            layouts={dashboardState.localLayout}
            onLayoutChange={handleLayoutChange}
            mode={mode}
            activeBreakpoint={effectiveActiveBreakpoint}
            lockedCanvasWidth={lockedCanvasWidth}
            onMetricsChange={({ containerWidth, containerBreakpoint, effectiveGridWidth }) => {
              setContainerWidth(containerWidth);
              setContainerBreakpoint(containerBreakpoint);
              setEffectiveGridWidth(effectiveGridWidth);
            }}
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
