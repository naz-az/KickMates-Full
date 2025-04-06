# KickMates App Assets

This directory contains all the image assets needed for the KickMates mobile application.

## Required Images

The following images should be included in this directory:

### App Icons
- `icon.png` - The main app icon (1024x1024 px)
- `favicon.png` - Web favicon (64x64 px)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024 px)
- `splash.png` - App splash screen (2048x2048 px)

### Brand Assets
- `logo.png` - The KickMates logo for login/register screens (512x512 px)

### Sport Category Images
Store these in the `images/` subdirectory:
- `football.jpg` - Football category image
- `basketball.jpg` - Basketball category image
- `tennis.jpg` - Tennis category image
- `running.jpg` - Running category image
- `cycling.jpg` - Cycling category image
- `yoga.jpg` - Yoga category image
- `default-sport.jpg` - Default sport placeholder

### Placeholder Images
- `user-placeholder.png` - Default user avatar
- `event-placeholder.png` - Default event image

## Fonts

The app uses custom Roboto fonts that should be included in the `fonts/` subdirectory:
- `Roboto-Regular.ttf`
- `Roboto-Medium.ttf`
- `Roboto-Bold.ttf`

## Directory Structure

```
assets/
├── images/
│   ├── football.jpg
│   ├── basketball.jpg
│   ├── tennis.jpg
│   ├── yoga.jpg
│   ├── running.jpg
│   ├── cycling.jpg
│   └── default-sport.jpg
├── fonts/
│   ├── Roboto-Regular.ttf
│   ├── Roboto-Medium.ttf
│   └── Roboto-Bold.ttf
├── logo.png
├── icon.png
├── adaptive-icon.png
├── splash.png
├── favicon.png
├── user-placeholder.png
└── event-placeholder.png
```

## Usage

Import the assets in your components like this:

```typescript
// Image import
import logoImage from '../assets/logo.png';
// or for images folder
import footballImage from '../assets/images/football.jpg';

// Using in component
<Image source={logoImage} style={styles.logo} />
``` 