import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import Home from "@/pages/Home"
import Pricing from "@/pages/Pricing"
import PaymentSuccess from "@/pages/PaymentSuccess"
import Settings from "@/pages/user/Settings"
import Placeholder from "@/pages/Placeholder"
import Workspace from "@/pages/Workspace"
import Gallery from "@/pages/Gallery"
import Login from "@/pages/auth/Login"
import Register from "@/pages/auth/Register"
import ResetPassword from "@/pages/auth/ResetPassword"

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "password/reset",
        element: <ResetPassword />,
      },
      {
        path: "workspace",
        element: <Workspace />,
      },
      {
        path: "gallery",
        element: <Gallery />,
      },
      {
        path: "pricing",
        element: <Pricing />,
      },
      {
        path: "payment/success",
        element: <PaymentSuccess />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
