import type { ComponentRef } from "react";
import { forwardRef } from "react";
import type { TextProps } from "react-native";
import { Text as NativeText } from "react-native";

export const Text = forwardRef<ComponentRef<typeof NativeText>, TextProps>(
  ({ className, ...props }, ref) => (
    <NativeText ref={ref} className={`font-sans ${className ?? ""}`} {...props} />
  ),
);

Text.displayName = "Text";
