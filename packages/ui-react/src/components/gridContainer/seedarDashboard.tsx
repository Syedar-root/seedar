import { GridContainer } from './gridContainter';
import { SeedarPanel } from './gridPanel/seedarPanel';
import { useDashboard } from '../../hooks';

interface SeedarDashboardProps {
  dashboardId: string;
}

export const SeedarDashboard: React.FC<SeedarDashboardProps> = ({
  dashboardId,
}) => {
  const { data: dashboardData, isPending, isError } = useDashboard(dashboardId);

  if (isPending || isError || !dashboardData) {
    return null;
  }

  return (
    <GridContainer layouts={dashboardData.layout}>
      {dashboardData.panels.map((panel) => (
        <SeedarPanel key={panel.id} panelId={panel.id} panel={panel} />
      ))}
    </GridContainer>
  );
};
