import { createBrowserRouter, RouterProvider } from "react-router-dom"
import Layout from "@/components/layout/Layout"
import Home from "@/pages/Home"
import Pricing from "@/pages/Pricing"
import PaymentSuccess from "@/pages/PaymentSuccess"
import Settings from "@/pages/user/Settings"
import Placeholder from "@/pages/Placeholder"
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
        element: <Placeholder title="Workspace" description="The creative workspace is currently being built." />,
      },
      {
        path: "gallery",
        element: <Placeholder title="Gallery" description="Browse community creations soon." />,
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
