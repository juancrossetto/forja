#!/bin/bash
# Método R3SET - Font Setup Script
# Downloads Space Grotesk, Manrope, and Lexend from Google Fonts

FONTS_DIR="$(dirname "$0")/../assets/fonts"
mkdir -p "$FONTS_DIR"
cd "$FONTS_DIR"

echo "📦 Descargando fuentes para Método R3SET..."

# Download Space Grotesk
echo "  → Space Grotesk..."
curl -sL "https://fonts.google.com/download?family=Space+Grotesk" -o /tmp/space-grotesk.zip
unzip -o -q /tmp/space-grotesk.zip -d /tmp/space-grotesk
# Space Grotesk uses variable font, we need to extract static versions
if [ -d "/tmp/space-grotesk/static" ]; then
  cp /tmp/space-grotesk/static/SpaceGrotesk-Regular.ttf "$FONTS_DIR/"
  cp /tmp/space-grotesk/static/SpaceGrotesk-Medium.ttf "$FONTS_DIR/"
  cp /tmp/space-grotesk/static/SpaceGrotesk-Bold.ttf "$FONTS_DIR/"
else
  # Variable font - copy and rename
  find /tmp/space-grotesk -name "*.ttf" | head -1 | xargs -I{} cp {} "$FONTS_DIR/SpaceGrotesk-Regular.ttf"
  cp "$FONTS_DIR/SpaceGrotesk-Regular.ttf" "$FONTS_DIR/SpaceGrotesk-Medium.ttf"
  cp "$FONTS_DIR/SpaceGrotesk-Regular.ttf" "$FONTS_DIR/SpaceGrotesk-Bold.ttf"
fi
rm -rf /tmp/space-grotesk /tmp/space-grotesk.zip

# Download Manrope
echo "  → Manrope..."
curl -sL "https://fonts.google.com/download?family=Manrope" -o /tmp/manrope.zip
unzip -o -q /tmp/manrope.zip -d /tmp/manrope
if [ -d "/tmp/manrope/static" ]; then
  cp /tmp/manrope/static/Manrope-Regular.ttf "$FONTS_DIR/"
  cp /tmp/manrope/static/Manrope-Medium.ttf "$FONTS_DIR/"
  cp /tmp/manrope/static/Manrope-SemiBold.ttf "$FONTS_DIR/"
  cp /tmp/manrope/static/Manrope-Bold.ttf "$FONTS_DIR/"
else
  find /tmp/manrope -name "*.ttf" | head -1 | xargs -I{} cp {} "$FONTS_DIR/Manrope-Regular.ttf"
  cp "$FONTS_DIR/Manrope-Regular.ttf" "$FONTS_DIR/Manrope-Medium.ttf"
  cp "$FONTS_DIR/Manrope-Regular.ttf" "$FONTS_DIR/Manrope-SemiBold.ttf"
  cp "$FONTS_DIR/Manrope-Regular.ttf" "$FONTS_DIR/Manrope-Bold.ttf"
fi
rm -rf /tmp/manrope /tmp/manrope.zip

# Download Lexend
echo "  → Lexend..."
curl -sL "https://fonts.google.com/download?family=Lexend" -o /tmp/lexend.zip
unzip -o -q /tmp/lexend.zip -d /tmp/lexend
if [ -d "/tmp/lexend/static" ]; then
  cp /tmp/lexend/static/Lexend-Regular.ttf "$FONTS_DIR/"
  cp /tmp/lexend/static/Lexend-Medium.ttf "$FONTS_DIR/"
  cp /tmp/lexend/static/Lexend-SemiBold.ttf "$FONTS_DIR/"
else
  find /tmp/lexend -name "*.ttf" | head -1 | xargs -I{} cp {} "$FONTS_DIR/Lexend-Regular.ttf"
  cp "$FONTS_DIR/Lexend-Regular.ttf" "$FONTS_DIR/Lexend-Medium.ttf"
  cp "$FONTS_DIR/Lexend-Regular.ttf" "$FONTS_DIR/Lexend-SemiBold.ttf"
fi
rm -rf /tmp/lexend /tmp/lexend.zip

echo ""
echo "✅ Fuentes instaladas en assets/fonts/:"
ls -la "$FONTS_DIR"/*.ttf 2>/dev/null
echo ""
echo "Fuentes listas! Ahora podés correr: npx expo start"
