import { verticalCompactor } from "react-grid-layout/core";

export const createGridCompactor = () => ({
  ...verticalCompactor,
  preventCollision: false,
});
