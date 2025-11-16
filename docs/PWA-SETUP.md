# PWA Setup for Aura ILP

Aura OS has been configured as a Progressive Web App (PWA), enabling users to install it on their devices and use it offline.

## Features Implemented

✅ **Web App Manifest** - Defines app metadata, icons, and display preferences
✅ **Service Worker** - Enables offline functionality and asset caching
✅ **Auto-update** - Service worker automatically updates when new versions are deployed
✅ **iOS Support** - Added Apple-specific meta tags for iOS installation
✅ **Caching Strategy** - Smart caching for fonts, scripts, and static assets

## What This Means

- 📱 **Installable**: Users can install Aura ILP on desktop and mobile devices
- ⚡ **Faster Loading**: Cached assets load instantly on repeat visits
- 🔌 **Offline Support**: Core functionality works without internet connection
- 🎨 **Native Feel**: Standalone mode provides app-like experience
- 🔄 **Auto-updates**: Service worker automatically updates to latest version

## Configuration

The PWA is configured in:
- **vite.config.ts** - PWA plugin configuration with manifest and workbox settings
- **index.html** - PWA meta tags and iOS-specific tags
- **public/** - App icons (SVG placeholders for now)

### Manifest Details

- **Name**: Aura ILP - Integral Life Practice
- **Short Name**: Aura ILP
- **Theme Color**: #8b5cf6 (purple)
- **Background**: #0a0a0a (dark)
- **Display Mode**: Standalone
- **Start URL**: Configurable via VITE_BASE_PATH

### Caching Strategy

The service worker uses Workbox with the following strategies:

1. **Precaching**: All JS, CSS, HTML, icons automatically cached on install
2. **Runtime Caching**:
   - Google Fonts: CacheFirst, 1 year expiration
   - CDN Resources (jsDelivr): CacheFirst, 1 year expiration
   - App Assets: Automatic versioning and updates

## Icons

### Current Setup

Currently using SVG placeholder icons with a purple gradient and "A" letter.

**Icon Files**:
- `pwa-64x64.svg` - Small icon
- `pwa-192x192.svg` - Standard icon
- `pwa-512x512.svg` - Large icon
- `maskable-icon-512x512.svg` - Maskable icon for adaptive display

### Generating Production Icons

For production, replace the SVG placeholders with proper PNG icons:

**Option 1: PWA Builder (Recommended)**
1. Visit https://www.pwabuilder.com/
2. Enter your deployed URL
3. Download the generated icon pack
4. Replace files in `/public/` directory
5. Update `vite.config.ts` to use `.png` extensions

**Option 2: Real Favicon Generator**
1. Visit https://realfavicongenerator.net/
2. Upload your logo/icon design
3. Generate all icon sizes
4. Download and replace in `/public/`

**Option 3: Manual Conversion**
1. Design icons in Figma/Sketch/Adobe XD
2. Export at required sizes: 64x64, 192x192, 512x512
3. Save as PNG with transparent background
4. Update file extensions in `vite.config.ts`

## Testing the PWA

### Local Testing

1. Build the app: `npm run build`
2. Preview: `npm run preview`
3. Open in browser and check:
   - Lighthouse PWA audit
   - Install prompt appears
   - Manifest loads correctly
   - Service worker registers

### Production Testing

After deployment:
1. Open Chrome DevTools
2. Go to Application tab
3. Check:
   - **Manifest**: Verify all fields are correct
   - **Service Workers**: Check registration status
   - **Storage**: Verify cached assets
4. Run Lighthouse audit for PWA score

### Installation

**Desktop (Chrome/Edge)**:
- Look for install icon in address bar
- Or: Menu → Install Aura ILP

**Mobile (iOS)**:
- Safari: Share → Add to Home Screen

**Mobile (Android)**:
- Chrome: Menu → Add to Home Screen
- Or: Install prompt will appear automatically

## Development

The PWA is enabled in development mode (`devOptions.enabled: true`), so you can test PWA features during development.

## Deployment Considerations

### GitHub Pages

The PWA works with GitHub Pages. The manifest `scope` and `start_url` automatically adjust based on `VITE_BASE_PATH`.

### Vercel

Works seamlessly with Vercel. Service worker is served with correct headers automatically.

### Service Worker Updates

The service worker uses `registerType: 'autoUpdate'`, which means:
- New versions automatically install in the background
- Users get updates on next page load
- No manual intervention required

## Troubleshooting

**Install prompt not showing?**
- Check manifest is valid (Chrome DevTools → Application → Manifest)
- Ensure HTTPS (required for PWA)
- Check browser console for errors

**Service worker not registering?**
- Check browser console
- Verify sw.js is accessible
- Check service worker scope

**Icons not displaying?**
- Verify icon files exist in /public/
- Check file paths in manifest
- Ensure correct MIME types (image/svg+xml or image/png)

**Offline not working?**
- Check service worker is active
- Verify assets are precached (Application → Cache Storage)
- Check network requests in DevTools

## Next Steps

1. ✅ Replace SVG placeholders with professional PNG icons
2. ✅ Test installation on various devices and browsers
3. ✅ Run Lighthouse audit and optimize PWA score
4. ✅ Consider adding offline fallback page
5. ✅ Add update notification UI for when new versions are available

## Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Vite PWA Plugin Docs](https://vite-pwa-org.netlify.app/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
