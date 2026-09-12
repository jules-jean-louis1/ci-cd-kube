import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { CiPage } from "./pages/CiPage";
import { HomePage } from "./pages/HomePage";
import { ArchitecturePage } from "./pages/ArchitecturePage";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/architecture", element: <ArchitecturePage /> },
      { path: "/ci", element: <CiPage /> },
    ],
  },
]);
