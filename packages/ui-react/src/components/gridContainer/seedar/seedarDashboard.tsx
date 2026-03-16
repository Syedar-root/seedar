import { GridContainer } from '../gridContainter';
import { SeedarPanel } from './seedarPanel';
import { SeedarDashboardContext } from './seedarDashboardContext';
import {
  Triggers,
  SaveTrigger,
  CancelTrigger,
  AddPanelTrigger,
  RemovePanelTrigger,
} from './seedarDashboardTriggers';
import { useDashboardActions } from '../../../hooks';
import type { Layouts } from '#pkg/seedar/types';

interface SeedarDashboardProps {
  dashboardId: string;
  autoUpdate?: boolean;
  children?: React.ReactNode;
}

export const SeedarDashboard: React.FC<SeedarDashboardProps> & {
  Triggers: typeof Triggers;
  SaveTrigger: typeof SaveTrigger;
  CancelTrigger: typeof CancelTrigger;
  AddPanelTrigger: typeof AddPanelTrigger;
  RemovePanelTrigger: typeof RemovePanelTrigger;
} = ({ dashboardId, autoUpdate = false, children }) => {
  const { data, actions, state } = useDashboardActions(dashboardId, autoUpdate);

  if (state.isLoading || state.isError || !data) {
    return null;
  }

  const handleLayoutChange = (newLayouts: Layouts) => {
    actions.updateLayout(newLayouts);
  };

  return (
    <SeedarDashboardContext.Provider
      value={{ dashboardId, data, actions, state }}
    >
      <GridContainer
        layouts={state.localLayout}
        onLayoutChange={handleLayoutChange}
      >
        {data.panels.map((panel) => (
          <SeedarPanel key={panel.id} panelId={panel.id} panel={panel} />
        ))}
      </GridContainer>
      {children}
    </SeedarDashboardContext.Provider>
  );
};

SeedarDashboard.Triggers = Triggers;
SeedarDashboard.SaveTrigger = SaveTrigger;
SeedarDashboard.CancelTrigger = CancelTrigger;
SeedarDashboard.AddPanelTrigger = AddPanelTrigger;
SeedarDashboard.RemovePanelTrigger = RemovePanelTrigger;
