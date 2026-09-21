# Study AI automation Android build

This folder is ready for a GitHub Actions Android build after the web bundle is copied into `dist/client`.

```bash
bun install
bun run build
npx cap sync android
cd android && ./gradlew assembleDebug
```

The native layer includes the notification listener service and `AutoReply` Capacitor bridge. Configure the Android SDK and JDK 17 in CI.
