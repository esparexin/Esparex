import "./global.css";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View, SafeAreaView } from "react-native";

export default function App() {
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      <View className="flex-1 justify-center items-center px-6">
        <View className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl items-center w-full">
          <Text className="text-2xl font-bold text-sky-400 mb-2">
            Esparex Mobile
          </Text>
          <Text className="text-sm text-slate-400 text-center mb-4">
            Expo SDK 52 Managed Workflow Architecture Baseline
          </Text>
          <View className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <Text className="text-xs font-semibold text-emerald-400">
              ADR-001 & ADR-004 Active
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
