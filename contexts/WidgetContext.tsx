
import * as React from "react";
import { createContext, useCallback, useContext } from "react";
import { Platform } from "react-native";

// Lazy load ExtensionStorage only on iOS
let ExtensionStorage: any = null;
let storage: any = null;

if (Platform.OS === "ios") {
  try {
    // Use dynamic import instead of require
    import("@bacons/apple-targets").then((AppleTargets) => {
      ExtensionStorage = AppleTargets.ExtensionStorage;
      // Initialize storage with your group ID
      storage = new ExtensionStorage("group.com.anonymous.Natively");
    }).catch((error) => {
      console.log("ExtensionStorage not available:", error);
    });
  } catch (error) {
    console.log("ExtensionStorage not available:", error);
  }
}

type WidgetContextType = {
  refreshWidget: () => void;
};

const WidgetContext = createContext<WidgetContextType | null>(null);

export function WidgetProvider({ children }: { children: React.ReactNode }) {
  const refreshWidget = useCallback(() => {
    if (Platform.OS === "ios" && ExtensionStorage) {
      try {
        ExtensionStorage.reloadWidget();
      } catch (error) {
        console.log("Failed to reload widget:", error);
      }
    }
  }, []);

  return (
    <WidgetContext.Provider value={{ refreshWidget }}>
      {children}
    </WidgetContext.Provider>
  );
}

export const useWidget = () => {
  const context = useContext(WidgetContext);
  if (!context) {
    throw new Error("useWidget must be used within a WidgetProvider");
  }
  return context;
};
