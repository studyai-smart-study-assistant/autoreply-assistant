# AutoReply Assistant

### PROJECT OVERVIEW & ARCHITECTURE

app name:- Study AI automation 

Build a complete, production-ready Android Hybrid Application using Capacitor.js, React, Tailwind CSS, and Lucide Icons.

The code will be pushed to GitHub and compiled into an Android APK via GitHub Actions CI/CD.



This app is a standalone local AI Auto-Responder & Notification Assistant for WhatsApp and Instagram.

CRITICAL: No authentication/login required. All settings, API keys, rules, and conversation logs must be stored strictly client-side using localStorage or IndexedDB.



---



### CORE FEATURES & REQUIREMENTS



1. **Native Android Background Engine (Generate Android Project Files):**

   - Provide the complete Native Android files in the `android/` folder:

     - `NotificationListenerService.java`: Listens to incoming notifications from target packages (`com.whatsapp`, `com.whatsapp.w4b`, `com.instagram.android`).

     - Extracts sender name, message content, and `NotificationCompat.Action.WearableExtender` / `RemoteInput` for Direct Reply.

     - Direct Reply Execution: Native logic to fill the text and trigger the pending reply intent directly from the background service.

     - Custom Capacitor Bridge/Plugin (`AutoReplyPlugin.java` & `AutoReplyPlugin.ts`): Exposes methods to toggle the service, check Notification Listener permission status, request notification access intent (`Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS`), and sync rules/LLM configs between Web UI and Native Android SharedPreferences.

     - Updated `AndroidManifest.xml` with `<service android:name=".NotificationService" android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE">` and necessary intent filters.



2. **BYO-LLM (Bring Your Own Model) Configuration:**

   - Provider settings screen allowing custom OpenAI-compatible API configurations:

     - Custom Base URL (e.g., OpenRouter, Together AI, Groq, Ollama, OpenAI).

     - API Key input (masked with show/hide toggle).

     - Model Name input (e.g., `llama-3.3-70b`, `gpt-4o-mini`, `gemini-2.5-flash`).

     - "Test Connection" button to send a lightweight ping and verify credentials.



3. **App Targets & Smart Rule Engine:**

   - App Selection Toggles:

     - WhatsApp / WhatsApp Business (Toggle On/Off)

     - Instagram Direct Messages (Toggle On/Off)

   - Custom System Prompt: Multiline text area allowing the user to set their persona, tone, and rules (e.g., "Act as my personal assistant, keep replies under 20 words, polite tone").

   - Keyword / Rule Templates (Trigger-Response Mapping):

     - Users can add custom rules (e.g., If message contains "Hi" or "Hello" -> Reply with pre-set template).

     - Fallback / Default Toggle: "If no rule matches, pass context to LLM for autonomous reply" vs "Do nothing".

     - Cooldown / Anti-spam filter (e.g., do not reply more than once every X minutes to the same sender).



4. **Live Activity & Message Logs Dashboard:**

   - Clean timeline/card view showing:

     - Timestamp, Sender Name/Handle, App Source badge (WhatsApp / Instagram), Received Message, Sent Reply, and Status badge (Replied via Template / Replied via AI / Skipped).

     - Search & filter logs by app or status.

     - "Clear Logs" and "Export Logs (JSON)" buttons.



5. **Permission & Status Banner:**

   - Prominent header status indicator:

     - Green: "Assistant Active & Listening"

     - Red/Yellow: "Notification Permission Missing" with a one-tap button to open Android Notification Listener settings.



6. **UI/UX Design Standard:**

   - Modern Native Android Feel (Material You / Clean Dark Mode aesthetic).

   - Bottom navigation bar:

     - **Home / Status**: Quick toggle master switch, active apps status, quick stats (replies today).

     - **Rules & AI**: System prompt editor, custom templates list, fallback toggles.

     - **Settings**: LLM Base URL, API Key, Delay/Cooldown controls, Notification Permissions.

     - **Logs**: Real-time history of handled notifications.

   - Polished transitions, haptic-like button states, toast notifications for saved settings.



---



### OUTPUT INSTRUCTIONS:

- Write clean, modular, production-ready React components.

- Include all Capacitor native bridge code (`android/app/src/main/java/...`) and configuration files (`capacitor.config.ts`, `AndroidManifest.xml`).

- Ensure all sta

tes persist locally so no data is lost on reload or app kill.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1d0e67ce-4454-489f-aea1-5bf67ee61e8c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
