import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Plug,
  MessageCircle,
} from "lucide-react";
import { useAppStore } from "@/core/store";
import styles from "./GlobalNavigation.module.scss";
import type { GlobalNavigationProps, NavItem } from "./types";

const seeMindLetters = ["S", "E", "E", "M", "I", "N", "D"];

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
    <nav className={styles.globalNav}>
      <NavLink to="/dashboard" className={styles.logo}>
        Seedar
      </NavLink>

      <div className={styles.navItems}>
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
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

      <button
        type="button"
        role="switch"
        aria-checked={isSeeMindOn}
        aria-label={
          isSeeMindOn ? "关闭 SeeMind 侧边对话框" : "打开 SeeMind 侧边对话框"
        }
        className={`${styles.seeMindSwitch} ${
          isSeeMindOn ? styles.seeMindSwitchActive : ""
        }`}
        onClick={toggleSeeMind}
      >
        <span className={styles.switchTrack} aria-hidden="true">
          <span className={styles.switchActiveField} />
          <span className={styles.switchGrid} />
          <span className={styles.switchText}>
            {seeMindLetters.map((letter, index) => (
              <span key={`${letter}-${index}`} className={styles.switchTextLetter}>
                {letter}
              </span>
            ))}
          </span>
          <span className={styles.switchBeam} />
          <span className={styles.switchThumb}>
            <span className={styles.thumbHalo} />
            <MessageCircle size={16} strokeWidth={2.1} />
          </span>
        </span>
      </button>
    </nav>
  );
};
