import { useState } from "react";
import { useDashboards, useCreateDashboard } from "#pkg/seedar/ui-react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, LayoutDashboard } from "lucide-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import { toast } from "sonner";
import clsx from "clsx";
import styles from "./DashboardAside.module.scss";
import { CreateDashboardDialog } from "./components/createDashboardDialog/CreateDashboardDialog";

export const DashboardAside = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams();
  const { data: dashboards } = useDashboards();
  const { mutate: createDashboard } = useCreateDashboard();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDashboardClick = (id: string) => {
    navigate(`/dashboard/${id}`);
  };

  const handleCreateDashboard = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  const handleDashboardCreated = (dashboardId: string) => {
    toast.success("看板创建成功");
    navigate(`/dashboard/${dashboardId}`);
    setIsDialogOpen(false);
  };

  return (
    <aside className={styles.aside}>
      <div className={styles.header}>
        <span className={styles.title}>看板列表</span>
        <button
          className={styles.addButton}
          onClick={handleCreateDashboard}
          title="新建看板"
        >
          <Plus size={16} />
        </button>
      </div>
      <ScrollArea className={styles.list}>
        {dashboards?.map((dashboard) => (
          <div
            key={dashboard.id}
            className={clsx(
              styles.item,
              dashboard.id === dashboardId && styles.active,
            )}
            onClick={() => handleDashboardClick(dashboard.id)}
          >
            <LayoutDashboard size={16} className={styles.icon} />
            <span className={styles.name}>{dashboard.name}</span>
          </div>
        ))}
        {!dashboards?.length && <div className={styles.empty}>暂无看板</div>}
      </ScrollArea>
      <CreateDashboardDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        onSuccess={handleDashboardCreated}
      />
    </aside>
  );
};
