import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import { useResolveClassNames } from "uniwind";

export default function TabsLayout() {
  const headerStyle = useResolveClassNames("bg-bg");
  const tabBarStyle = useResolveClassNames("bg-surface border-surface rounded-t-[32] absolute");
  const headerTintColor = useResolveClassNames("text-tab-active").color as string;
  const tabBarActiveTintColor = useResolveClassNames("text-tab-active").color as string;
  const tabBarInactiveTintColor = useResolveClassNames("text-tab-inactive").color as string;

  return (
    <Tabs
      screenOptions={{
        headerStyle,
        headerTintColor,
        tabBarStyle,
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        headerShown: true,
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: "Home",
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="validators"
        options={{
          title: "Validators",
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="security" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: "Network",
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="network" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
