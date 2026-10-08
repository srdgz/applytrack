import type { ReactNode } from "react";
import { ScrollView } from "react-native";
import type { Edge } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({
  children,
  centered = false,
  edges = ["top", "bottom", "left", "right"],
}: {
  readonly children: ReactNode;
  readonly centered?: boolean;
  readonly edges?: readonly Edge[];
}) => (
  <SafeAreaView edges={edges} className="flex-1 bg-canvas">
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName={`grow gap-6 p-4 ${centered ? "justify-center" : ""}`}
    >
      {children}
    </ScrollView>
  </SafeAreaView>
);
