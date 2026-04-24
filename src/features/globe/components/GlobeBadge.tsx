import { View, type ViewProps } from "react-native";

interface GlobeBadgeProps extends ViewProps {
  position: "left" | "right" | "stretch";
}

const POSITION_MAP = {
  left: "items-start",
  right: "items-end",
  stretch: "items-stretch",
};

export function GlobeBadge({ position, style, className, children }: GlobeBadgeProps) {
  return (
    <View className={`w-full h-auto absolute px-2 ${className}`} style={style}>
      <View className={`grow justify-center ${POSITION_MAP[position]}`}>
        <View className={`flex-col ${POSITION_MAP[position]} gap-3 bg-card p-4 rounded-3xl`}>
          {children}
        </View>
      </View>
    </View>
  );
}
