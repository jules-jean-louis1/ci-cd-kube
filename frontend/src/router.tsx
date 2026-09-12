import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CiPage } from "./pages/CiPage";
import { HomePage } from "./pages/HomePage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/ci", element: <CiPage /> },
    ],
  }
]);
