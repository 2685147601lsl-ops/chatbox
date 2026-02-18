---
name: Android Release Master
description: Expert workflow for building, signing, and releasing Android APKs for Chatbox
---
# Android Release Master

This skill guides the process of building, signing, and managing Android releases for the Chatbox project. It handles Capacitor configuration, Gradle builds, and ensuring the correct artifacts are produced.

## Prerequisites

-   Environment must have Java SDK (JDK 17/21) installed.
-   Android SDK command-line tools must be available.
-   Node.js dependencies must be installed (`pnpm install`).

## Build Workflow

1.  **Web Assets Build**:
    -   Run `npx electron-vite build` with `CHATBOX_BUILD_PLATFORM=android`.
    -   This generates the web assets in `release/app/dist/renderer`.

2.  **Capacitor Sync**:
    -   Run `npx cap sync android`.
    -   This copies the web assets into the Android native project (`android/app/src/main/assets/public`).

3.  **Grade Build**:
    -   Navigate to `android/`.
    -   Run `./gradlew assembleDebug` for debug builds.
    -   Run `./gradlew assembleRelease` for release builds.

## Troubleshooting Common Issues

### "Layer Covered" / UI Overlay Issue
-   **Symptom**: On Android, fetch or browser tool results might render raw HTML that breaks the layout or covers the screen.
-   **Fix**: Ensure `fetch` and `browser` implementation in `cherry.ts` wraps HTML output in markdown code blocks (` ```html ... ``` `).
-   **Check**: Verify `src/renderer/native/stream-http.ts` is correctly handling streams if applicable.

### Build Failures
-   **Java Version**: Ensure `JAVA_HOME` points to JDK 17 or higher.
-   **Gradle Sync**: If build fails, try running `./gradlew clean` first.

## Release Checklist

-   [ ] Bump version in `package.json`.
-   [ ] Verify `android/app/build.gradle` version code updates (or is auto-managed).
-   [ ] Run full build cycle.
-   [ ] Test APK on device for "white screen" or "network error" issues.
