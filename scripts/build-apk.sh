#!/bin/bash
# Build APK with embedded token
# Usage: ./build-apk.sh <token> [output-dir]

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <token> [output-dir]"
  echo "Example: $0 abc123 ./apks"
  exit 1
fi

TOKEN="$1"
OUTPUT_DIR="${2:-./public/apks}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/.."
ANDROID_DIR="$BACKEND_DIR/../android-app"
BASE_APK="$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk"
CONFIG_FILE="$ANDROID_DIR/app/src/main/assets/config.json"

if [ ! -f "$ANDROID_DIR/build.gradle.kts" ]; then
  echo "Error: Android project not found at $ANDROID_DIR"
  exit 1
fi

# Write token to config
echo "{\"apiUrl\":\"$API_URL\",\"token\":\"$TOKEN\"}" > "$CONFIG_FILE"
echo "Config written with token: $TOKEN"

# Build APK
cd "$ANDROID_DIR"
echo "Building APK..."
if command -v ./gradlew &> /dev/null; then
  ./gradlew assembleDebug
elif command -v gradle &> /dev/null; then
  gradle assembleDebug
else
  echo "Error: Gradle not found. Open the project in Android Studio to build."
  exit 1
fi

# Copy to output directory
mkdir -p "$OUTPUT_DIR"
cp "$BASE_APK" "$OUTPUT_DIR/app-$TOKEN.apk"
echo "APK generated: $OUTPUT_DIR/app-$TOKEN.apk"
