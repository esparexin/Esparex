import "./global.css";
import React from "react";
import { AppProvider } from "./src/providers";
import { AppErrorBoundary } from "./src/providers/AppErrorBoundary";
import { services } from "./src/bootstrap";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProvider services={services}>
        <RootNavigator />
      </AppProvider>
    </AppErrorBoundary>
  );
}
