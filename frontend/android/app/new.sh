#!/bin/zsh

# 1. Point to Android Studio's built-in Java (to fix "Unable to locate Java")
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# 2. Set Signing Variables
export ANDROID_KEYSTORE_PASSWORD=MV_shreehaan9
export ANDROID_KEY_ALIAS=esparex
export ANDROID_KEY_PASSWORD=MV_shreehaan9

echo "🚀 Starting Production Release Build using Android Studio Java..."

# 3. Navigate to Android folder and Build
cd /Users/admin/Desktop/EsparexAdmin/frontend/android
./gradlew assembleRelease

# 4. Success Message
echo "✅ Build Complete!"
echo "📦 Your APK is at: frontend/android/app/build/outputs/apk/release/Esparex_v1.2_release.apk"
