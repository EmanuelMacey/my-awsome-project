
# 🔔 How to Add Notification Test Button to Profile Screens

## Quick Guide

Add this button to any profile screen to access the notification test screen.

---

## For Customer Profile Screen

**File:** `src/screens/customer/CustomerProfileScreen.tsx`

Add this button after the "Logout" button:

```tsx
{/* Notification Test Button */}
<TouchableOpacity
  style={[styles.button, { backgroundColor: '#FF6B35', marginTop: 16 }]}
  onPress={() => router.push('/notification-test')}
>
  <Text style={styles.buttonText}>🔔 Test Notifications</Text>
</TouchableOpacity>
```

---

## For Driver Profile Screen

**File:** `src/screens/driver/DriverProfileScreen.tsx`

Add this button after the "Logout" button:

```tsx
{/* Notification Test Button */}
<TouchableOpacity
  style={[styles.button, { backgroundColor: '#FF6B35', marginTop: 16 }]}
  onPress={() => router.push('/notification-test')}
>
  <Text style={styles.buttonText}>🔔 Test Notifications</Text>
</TouchableOpacity>
```

---

## For Admin Dashboard

**File:** `src/screens/admin/AdminDashboardScreen.tsx`

Add this button in the header or as a menu item:

```tsx
{/* Notification Test Button */}
<TouchableOpacity
  style={styles.testNotificationButton}
  onPress={() => router.push('/notification-test')}
>
  <Text style={styles.testNotificationButtonText}>🔔 Test Notifications</Text>
</TouchableOpacity>
```

Add this style:

```tsx
testNotificationButton: {
  backgroundColor: '#FF6B35',
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 8,
  marginTop: 8,
},
testNotificationButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '600',
},
```

---

## Alternative: Add to Settings Menu

If you have a settings screen, add it there:

```tsx
<TouchableOpacity
  style={styles.settingsItem}
  onPress={() => router.push('/notification-test')}
>
  <Text style={styles.settingsItemIcon}>🔔</Text>
  <Text style={styles.settingsItemText}>Test Notifications</Text>
  <Text style={styles.settingsItemArrow}>›</Text>
</TouchableOpacity>
```

---

## Quick Test

After adding the button:

1. **Restart the app** (to ensure the new route is loaded)
2. **Navigate to the profile screen**
3. **Tap the "🔔 Test Notifications" button**
4. **You should see the notification test screen**
5. **Grant permissions and test notifications!**

---

## Troubleshooting

### "Button doesn't appear"
- Make sure you saved the file
- Restart the app completely
- Check for syntax errors in the console

### "Button appears but doesn't work"
- Check that you imported `router` from `expo-router`
- Check the console for navigation errors
- Make sure the route is registered in `app/_layout.tsx`

### "Route not found error"
- Verify `app/notification-test.tsx` exists
- Check that the route is added to `app/_layout.tsx`
- Restart the Metro bundler

---

## Done!

You now have a quick way to access the notification test screen from anywhere in your app! 🎉
