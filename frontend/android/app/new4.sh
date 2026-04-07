#!/bin/zsh

# 1. Point to the absolute path of ADB on your Mac
ADB="/Users/admin/Library/Android/sdk/platform-tools/adb"

echo "🚀 Attempting Wireless/USB Installation of Esparex v1.2..."

# 2. Run the installation
$ADB install -r /Users/admin/Desktop/EsparexAdmin/frontend/android/app/build/outputs/apk/release/Esparex_v1.2_release.apk

# 3. Message
echo "🎉 Installation Attempt Finished!"
