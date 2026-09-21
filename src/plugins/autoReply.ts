import { registerPlugin } from "@capacitor/core";

export interface AutoReplyConfig {
  active: boolean;
  targets: { whatsapp: boolean; instagram: boolean };
  systemPrompt: string;
  fallback: "ai" | "skip";
  cooldown: number;
  delay: number;
  baseUrl: string;
  apiKey: string;
  model: string;
  rules: Array<{ id: string; trigger: string; response: string; enabled: boolean }>;
}

export interface AutoReplyPlugin {
  isNotificationAccessEnabled(): Promise<{ enabled: boolean }>;
  openNotificationAccess(): Promise<void>;
  setServiceEnabled(options: { enabled: boolean }): Promise<{ enabled: boolean }>;
  getServiceStatus(): Promise<{ enabled: boolean; accessGranted: boolean }>;
  syncConfig(options: { config: AutoReplyConfig }): Promise<{ synced: boolean }>;
}

export const AutoReply = registerPlugin<AutoReplyPlugin>("AutoReply");
