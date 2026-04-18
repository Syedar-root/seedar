import { noCompactor } from "react-grid-layout";

export const createGridCompactor = () => ({
  ...noCompactor,
  preventCollision: true,
});
