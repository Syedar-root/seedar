import { NavLink } from "react-router-dom";
import { LayoutDashboard, BarChart3, Database, Plug } from "lucide-react";
import { useAppStore } from "@/core/store";
import { SeeMindSwitch } from "./components/SeeMindSwitch";
import styles from "./GlobalNavigation.module.scss";
import type { GlobalNavigationProps, NavItem } from "./types";

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "仪表板",
    path: "/dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "panel",
    label: "图表面板",
    path: "/panel",
    icon: <BarChart3 size={18} />,
  },
  {
    id: "dataset",
    label: "数据集",
    path: "/dataset",
    icon: <Database size={18} />,
  },
  {
    id: "datasource",
    label: "数据源",
    path: "/datasource",
    icon: <Plug size={18} />,
  },
];

export const GlobalNavigation = (_props: GlobalNavigationProps) => {
  const { isSeeMindOn, toggleSeeMind } = useAppStore();

  return (
    <nav className={styles.globalNav} data-tour-id="global-nav">
      <NavLink
        to="/dashboard"
        className={styles.logo}
        data-tour-id="global-nav-logo"
      >
        Seedar
      </NavLink>

      <div className={styles.navItems}>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            data-tour-id={`global-nav-${item.id}`}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
            end={item.path === "/dashboard"}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className={styles.spacer} />

      <div data-tour-id="global-nav-seemind-switch">
        <SeeMindSwitch isActive={isSeeMindOn} onToggle={toggleSeeMind} />
      </div>
    </nav>
  );
};
