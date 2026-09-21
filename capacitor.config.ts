import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.studyai.automation",
  appName: "Study AI automation",
  webDir: ".output/public",
  bundledWebRuntime: false,
  plugins: {
    AutoReply: {
      appPackages: ["com.whatsapp", "com.whatsapp.w4b", "com.instagram.android"],
    },
  },
};

export default config;
