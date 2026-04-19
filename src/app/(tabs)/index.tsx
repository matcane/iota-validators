import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeTab() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 items-center bg-background" style={{ paddingTop: insets.top }}>
      <Text className="text-amber-300">Home</Text>
    </View>
  );
}
