import { RouterProvider } from "react-router-dom";
import { router } from "./core/router";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
