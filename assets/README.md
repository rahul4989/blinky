# Blinky App Icons

This directory contains the app icons for different platforms:

- `icon.svg` - Source SVG icon (512x512)
- `icon.png` - PNG icon for Linux builds (512x512)
- `icon.ico` - Windows ICO icon (multiple sizes)
- `icon.icns` - macOS ICNS icon (multiple sizes)

## Icon Design
The icon features an eye with eyelashes, representing the blink detection functionality of the app. The gradient blue color scheme represents technology and health.

## Generating Platform Icons
To generate the platform-specific icons from the SVG:

### For macOS (.icns):
```bash
# Convert SVG to PNG at different sizes, then create ICNS
# You'll need to use iconutil or similar tools
```

### For Windows (.ico):
```bash
# Convert SVG to ICO with multiple sizes
# You can use online converters or ImageMagick
```

### For Linux (.png):
```bash
# Simple PNG export at 512x512
```

Note: For production, consider using professional icon generation tools or services to ensure pixel-perfect icons at all sizes.
