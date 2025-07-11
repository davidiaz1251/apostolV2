# Native Platform Setup Guide

## iOS Setup

### 1. Prerequisites
- Xcode 14.0 or later
- iOS 13.0 or later target

### 2. Add iOS Platform (if not already added)
```bash
npx cap add ios
```

### 3. Firebase Configuration
1. Download `GoogleService-Info.plist` from Firebase Console
2. Add it to `ios/App/App/` directory
3. In Xcode, right-click on `App` folder and select "Add Files to App"
4. Select `GoogleService-Info.plist` and make sure it's added to the target

### 4. Configure Info.plist
Add URL schemes for Google Sign-In in `ios/App/App/Info.plist`:
```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>REVERSED_CLIENT_ID</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>YOUR_REVERSED_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

### 5. Sync and Build
```bash
npx cap sync ios
npx cap open ios
```

## Android Setup

### 1. Prerequisites
- Android Studio 4.0 or later
- Android SDK 24 or later

### 2. Add Android Platform (if not already added)
```bash
npx cap add android
```

### 3. Firebase Configuration
1. Download `google-services.json` from Firebase Console
2. Add it to `android/app/` directory

### 4. Configure build.gradle
Add to `android/build.gradle` (project level):
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
}
```

Add to `android/app/build.gradle` (app level):
```gradle
apply plugin: 'com.google.gms.google-services'
```

### 5. Sync and Build
```bash
npx cap sync android
npx cap open android
```

## Web Setup

The web platform uses the Firebase Web SDK and requires no additional configuration beyond the existing Firebase config.

## Testing

### Authentication
- Test email/password sign-in
- Test Google Sign-In
- Test sign-out functionality

### Firestore
- Test data synchronization
- Test offline functionality
- Test CRUD operations

### Storage
- Test file uploads
- Test download URL generation

### Remote Config
- Test configuration fetching
- Test version-based updates

## Troubleshooting

### Common Issues

1. **iOS Build Errors**
   - Ensure `GoogleService-Info.plist` is properly added to the target
   - Check that URL schemes are correctly configured
   - Verify Firebase project settings

2. **Android Build Errors**
   - Ensure `google-services.json` is in the correct location
   - Check that Google Services plugin is applied
   - Verify Firebase project settings

3. **Authentication Issues**
   - Check Firebase Authentication is enabled
   - Verify OAuth configuration for Google Sign-In
   - Ensure proper URL schemes are configured

4. **Firestore Issues**
   - Check Firestore security rules
   - Verify network connectivity
   - Check offline persistence settings

### Debug Mode
Enable debug logging by adding this to your app initialization:
```typescript
// In development mode
if (!environment.production) {
  console.log('🔧 Debug mode enabled');
}
```

## Performance Optimization

### Native Platforms
- Use native plugins for all Firebase operations
- Implement proper offline caching
- Optimize image loading and storage

### Web Platform
- Use Firebase Web SDK v9+ modular approach
- Implement proper error handling
- Use appropriate caching strategies

## Next Steps

1. Test the application on both iOS and Android devices
2. Verify all Firebase services are working correctly
3. Test offline functionality
4. Performance test compared to previous Angular Fire implementation
5. Deploy to production when ready

## Support

For issues specific to Capacitor Firebase plugins, refer to:
- [Capacitor Firebase Documentation](https://github.com/capawesome-team/capacitor-firebase)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/docs)
