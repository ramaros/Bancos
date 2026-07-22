import React, { useState, useEffect } from "react";
import PinScreen from "./components/PinScreen";
import Dashboard from "./components/Dashboard";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  // Check if session is already unlocked (to preserve unlocked state on fast hot-reloads)
  useEffect(() => {
    const unlocked = sessionStorage.getItem("app_unlocked");
    if (unlocked === "true") {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = () => {
    setIsUnlocked(true);
    sessionStorage.setItem("app_unlocked", "true");
  };

  const handleLock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem("app_unlocked");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500/30 selection:text-emerald-900" id="app-root">
      {isUnlocked ? (
        <Dashboard onLock={handleLock} />
      ) : (
        <PinScreen onUnlock={handleUnlock} />
      )}
    </div>
  );
}
