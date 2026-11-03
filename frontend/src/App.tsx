import { useState } from "react";
import { getToken, clearToken } from "./utils/auth/auth.ts";
import Login from "./pages/login";
import Register from "./pages/register";
import Home from "./pages/home/index.tsx";
// import Home from "./pages/Home"; // uncomment when ready

type Screen = "login" | "register" | "dashboard";

const App = () => {
  const existing = getToken();
  const [screen, setScreen] = useState<Screen>(existing ? "dashboard" : "login");
  const [token, setToken] = useState<string>(existing ?? "");

  const handleAuthSuccess = (t: string) => {
    setToken(t);
    setScreen("dashboard");
  };

  const handleLogout = () => {
    clearToken();
    setToken("");
    setScreen("login");
  };

  if (screen === "login") {
    return (
      <Login
        onSuccess={handleAuthSuccess}
        onGoRegister={() => setScreen("register")}
      />
    );
  }

  if (screen === "register") {
    return (
      <Register
        onSuccess={handleAuthSuccess}
        onGoLogin={() => setScreen("login")}
      />
    );
  }

  // Dashboard — pass token down, wire logout to header
  return (
    <div>
      <p style={{ color: "#64748b", fontFamily: "monospace", padding: "12px 24px", fontSize: 12 }}>
        ✓ Logged in — token: {token.slice(0, 12) || "No Token"}…{" "}
        <button
          onClick={handleLogout}
          style={{ color: "#f87171", background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}
        >
          Logout
        </button>
      </p>
      <Home token={token} />
      <p style={{ color: "#64748b", fontFamily: "monospace", padding: "0 24px", fontSize: 12 }}>
        Sanat @expenseflow
      </p>
    </div>
  );
};

export default App;
