
# ErrandRunners - Remaining Fixes Implementation Plan

## 1. Biometric Authentication (iOS & Android)
- Install `expo-local-authentication`
- Add biometric prompt on app launch after initial login
- Store secure token with biometric protection
- Fallback to password if biometric fails

## 2. App Icon & Notifications Icon
- Replace app icon in `app.json` with provided image
- Configure adaptive icons for Android
- Set notification icon for push notifications

## 3. Push Notifications System
**Admin/Driver receives:**
- New order placed
- New errand created

**Customer receives:**
- Order accepted by driver
- Order in transit
- Order delivered
- Errand accepted
- Errand in progress
- Errand completed

## 4. Admin/Driver Management (Owner Only)
- Create `admin_permissions` table with owner flag
- Only owner can promote users to admin/driver
- Add user management screen for owner
- Restrict role changes to owner only

## 5. Auth Protection
- Add auth guard to prevent app access without login
- Redirect to login if no session exists
- Implement session persistence check on app launch

