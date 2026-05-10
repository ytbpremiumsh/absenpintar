import { Navigate } from "react-router-dom";

// Parent login is now merged into the main /login page as a tab.
export default function ParentLogin() {
  return <Navigate to="/login?as=parent" replace />;
}
