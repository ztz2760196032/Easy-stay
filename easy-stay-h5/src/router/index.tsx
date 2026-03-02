import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { HomePage } from "../pages/HomePage";
import { HotelDetailPage } from "../pages/HotelDetailPage";
import { HotelListPage } from "../pages/HotelListPage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "list",
        element: <HotelListPage />
      },
      {
        path: "hotel/:id",
        element: <HotelDetailPage />
      }
    ]
  }
]);
