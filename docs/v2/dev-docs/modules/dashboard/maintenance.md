# 面板与仪表盘维护提示

## 高风险点

1. 删除面板会连带删除 Query。
2. 仪表盘布局里的 `panelId` 一旦失真，会直接导致布局更新失败。
3. `panel.config` 与前端展示组件不一致时，最容易出现预览正常、展示异常的问题。

## 排查顺序

1. 看 Panel 是否存在
2. 看 Query 是否可执行
3. 看 Dashboard layout 是否引用了合法 panelId
4. 看 `SeedarDashboard` 渲染链路
