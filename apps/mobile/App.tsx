import "./global.css";
import React from "react";
import { AppProvider } from "./src/providers";
import { services } from "./src/bootstrap";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AppProvider services={services}>
      <RootNavigator />
    </AppProvider>
  );
}

