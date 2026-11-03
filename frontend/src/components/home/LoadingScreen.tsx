// src/components/home/LoadingScreen.tsx
import { Landmark } from "lucide-react";

const LoadingScreen = () => (
  <div className="loading-shell">
    <div className="loading-card">
      <div className="loading-icon">
        <Landmark size={24} color="#818cf8" />
      </div>
      <p className="loading-title">ExpenseFlow</p>
      <p className="loading-sub">Fetching your transactions...</p>
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
    </div>
  </div>
);

export default LoadingScreen;
