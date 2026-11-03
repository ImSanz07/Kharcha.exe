import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App';
import ExpenseTracker from './pages/home';
import AlienExpenseTracker from './pages/alien';
import ProtectedRoute from './components/ProtectedRoute';

// main.tsx
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/alt",
    element: (
      <ProtectedRoute>
        <ExpenseTracker token={""} />
      </ProtectedRoute>
    ),
  },
  {
    path: "/alien",
    element: (
      <ProtectedRoute>
        <AlienExpenseTracker />
      </ProtectedRoute>
    ),
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
