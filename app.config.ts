import type { ConfigContext, ExpoConfig } from "expo/config";

import { version } from "./package.json";

const SCHEME = "iota-validators";
const PROJECT_SLUG = "iota-validators";
const APP_NAME = "Iota Validators";

const BUNDLE_IDENTIFIER = "com.iota.validators";
const PACKAGE_NAME = "com.iota.validators";

const ICON = "./assets/images/icon.png";
const ADAPTIVE_ICON = "./assets/images/adaptive-icon.png";
const ADAPTIVE_ICON_BG = "#ffffff";

const SPLASH_ICON = "./assets/images/splash-icon.png";
const SPLASH_ICON_BG = "#000000";

const INTERFACE_STYLE: ExpoConfig["userInterfaceStyle"] = "dark";
const APP_ORIENTATION: ExpoConfig["orientation"] = "portrait";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: APP_NAME,
    slug: PROJECT_SLUG,
    scheme: SCHEME,
    version: version,
    orientation: APP_ORIENTATION,
    icon: ICON,
    userInterfaceStyle: INTERFACE_STYLE,
    newArchEnabled: true,
    ios: {
      supportsTablet: false,
      bundleIdentifier: BUNDLE_IDENTIFIER,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: ADAPTIVE_ICON,
        backgroundColor: ADAPTIVE_ICON_BG,
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: PACKAGE_NAME,
    },
    plugins: [
      "expo-asset",
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: SPLASH_ICON,
          backgroundColor: SPLASH_ICON_BG,
          imageWidth: 200,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };
};
