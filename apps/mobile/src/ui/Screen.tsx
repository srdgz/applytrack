import type { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import type { Edge } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

export const Screen = ({
  children,
  centered = false,
  edges = ["top", "bottom", "left", "right"],
  footer,
}: {
  readonly children: ReactNode;
  readonly centered?: boolean;
  readonly edges?: readonly Edge[];
  readonly footer?: ReactNode;
}) => (
  <SafeAreaView edges={edges} className="flex-1 bg-canvas">
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName={`grow gap-6 p-4 ${centered ? "justify-center" : ""}`}
    >
      {children}
    </ScrollView>
    {footer ? (
      <View className="flex-row gap-3 border-t border-border bg-surface p-4">{footer}</View>
    ) : null}
  </SafeAreaView>
);
