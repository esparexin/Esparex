import React, { useState, useCallback } from "react";
import AnimatedSplash from "./components/AnimatedSplash";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const handleFinish = useCallback(() => setShowSplash(false), []);

  return (
    <>
      {showSplash && (
        <AnimatedSplash
          onFinish={handleFinish}
          logo={require("../assets/splash-android.png")}
          backgroundColor="#0A0C0B"
        />
      )}
    </>
  );
}
