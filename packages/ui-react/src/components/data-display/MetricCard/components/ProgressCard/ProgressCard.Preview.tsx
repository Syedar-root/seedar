import React from "react";
import { ProgressCard } from "./ProgressCard";
import { mockProgressCardProps } from "./mock/data.tsx";

const PAGE_STYLE: React.CSSProperties = {
  padding: "24px",
  maxWidth: "1200px",
  margin: "0 auto",
};

const GRID_STYLE: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const TITLE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: "32px",
  lineHeight: 1.2,
  fontWeight: 700,
  color: "rgba(0, 0, 0, 0.88)",
};

const SECTION_TITLE_STYLE: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "20px",
  lineHeight: 1.3,
  fontWeight: 600,
  color: "rgba(0, 0, 0, 0.88)",
};

const TEXT_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: "14px",
  lineHeight: 1.6,
  color: "rgba(0, 0, 0, 0.65)",
};

const DIVIDER_STYLE: React.CSSProperties = {
  margin: "24px 0 32px",
  border: 0,
  borderTop: "1px solid rgba(15, 23, 42, 0.08)",
};

const PANEL_STYLE: React.CSSProperties = {
  padding: "20px",
  border: "1px solid rgba(15, 23, 42, 0.08)",
  borderRadius: "16px",
  backgroundColor: "#fff",
};

interface PreviewSectionProps {
  title: string;
  children: React.ReactNode;
}

const PreviewSection: React.FC<PreviewSectionProps> = ({ title, children }) => {
  return (
    <section style={{ marginBottom: "48px" }}>
      <h2 style={SECTION_TITLE_STYLE}>{title}</h2>
      {children}
    </section>
  );
};

export const ProgressCardPreview: React.FC = () => {
  return (
    <div style={PAGE_STYLE}>
      <h1 style={TITLE_STYLE}>ProgressCard 进度卡片预览</h1>
      <p style={{ ...TEXT_STYLE, marginTop: "8px" }}>
        纯 React + CSS Modules 的进度卡片，用于展示当前值、目标值、剩余值和进度状态。
      </p>

      <hr style={DIVIDER_STYLE} />

      <PreviewSection title="基础样式">
        <div style={GRID_STYLE}>
          <ProgressCard {...mockProgressCardProps.q2Revenue} />
          <ProgressCard {...mockProgressCardProps.userSignups} />
          <ProgressCard {...mockProgressCardProps.activeProjects} />
        </div>
      </PreviewSection>

      <PreviewSection title="特殊状态">
        <div style={GRID_STYLE}>
          <ProgressCard {...mockProgressCardProps.fullProgress} />
          <ProgressCard {...mockProgressCardProps.zeroProgress} />
        </div>
      </PreviewSection>

      <PreviewSection title="功能说明">
        <div style={PANEL_STYLE}>
          <p style={{ ...TEXT_STYLE, marginBottom: "12px" }}>
            <strong style={{ color: "rgba(0, 0, 0, 0.88)" }}>1. 单位解析：</strong>
            支持根据 K、M、B 等后缀推导剩余值展示。
          </p>
          <p style={{ ...TEXT_STYLE, marginBottom: "12px" }}>
            <strong style={{ color: "rgba(0, 0, 0, 0.88)" }}>2. 进度裁剪：</strong>
            百分比会自动限制在 0% 到 100% 之间。
          </p>
          <p style={{ ...TEXT_STYLE, marginBottom: "12px" }}>
            <strong style={{ color: "rgba(0, 0, 0, 0.88)" }}>3. 颜色可配：</strong>
            通过 <code>progressColor</code> 控制图标和进度条主色。
          </p>
          <p style={TEXT_STYLE}>
            <strong style={{ color: "rgba(0, 0, 0, 0.88)" }}>4. 标签可配：</strong>
            通过 <code>targetLabel</code> 和 <code>remainingLabel</code> 调整文案。
          </p>
        </div>
      </PreviewSection>
    </div>
  );
};
