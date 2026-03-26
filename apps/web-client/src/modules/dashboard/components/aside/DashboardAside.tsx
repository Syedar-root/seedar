import { useDashboards, useCreateDashboard } from "#pkg/seedar/ui-react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, LayoutDashboard } from "lucide-react";
import { ScrollArea } from "@/core/components/ui/ScrollArea";
import clsx from "clsx";
import styles from "./DashboardAside.module.scss";

export const DashboardAside = () => {
  const navigate = useNavigate();
  const { dashboardId } = useParams();
  const { data: dashboards } = useDashboards();
  const { mutate: createDashboard } = useCreateDashboard();

  const handleDashboardClick = (id: string) => {
    navigate(`/dashboard/${id}`);
  };

  const handleCreateDashboard = () => {
    createDashboard(
      { name: "新建看板" },
      {
        onSuccess: (data) => {
          navigate(`/dashboard/${data.id}`);
        },
      }
    );
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
              dashboard.id === dashboardId && styles.active
            )}
            onClick={() => handleDashboardClick(dashboard.id)}
          >
            <LayoutDashboard size={16} className={styles.icon} />
            <span className={styles.name}>{dashboard.name}</span>
          </div>
        ))}
        {!dashboards?.length && (
          <div className={styles.empty}>暂无看板</div>
        )}
      </ScrollArea>
    </aside>
  );
};
