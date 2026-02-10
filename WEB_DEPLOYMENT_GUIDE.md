
# 🌐 Web Deployment Guide for MaceyRunners

This guide will help you deploy your MaceyRunners app as a website that customers can access from any browser.

## 📋 Prerequisites

Before deploying to web, ensure you have:
- Node.js installed (v18 or higher)
- Your Expo project set up and working locally
- A hosting service account (we'll cover multiple options)

## 🚀 Quick Start - Local Web Testing

### 1. Test Locally First

```bash
# Install dependencies
npm install

# Start the web development server
npm run web
```

This will open your app in a browser at `http://localhost:8081`

### 2. Build for Production

```bash
# Build the web app for production
npx expo export -p web
```

This creates an optimized build in the `dist/` folder.

## 🌍 Deployment Options

### Option 1: Netlify (Recommended - Free & Easy)

**Why Netlify?**
- Free tier available
- Automatic HTTPS
- Easy custom domain setup
- Continuous deployment from Git

**Steps:**

1. **Sign up at [netlify.com](https://netlify.com)**

2. **Install Netlify CLI:**
```bash
npm install -g netlify-cli
```

3. **Build your app:**
```bash
npx expo export -p web
```

4. **Deploy:**
```bash
netlify deploy --dir=dist --prod
```

5. **Follow the prompts:**
   - Create a new site or link to existing
   - Choose a site name (e.g., `maceyrunners`)
   - Your site will be live at `https://maceyrunners.netlify.app`

6. **Add Custom Domain (Optional):**
   - Go to Netlify dashboard → Domain settings
   - Add your custom domain (e.g., `www.maceyrunners.com`)
   - Update DNS records as instructed

### Option 2: Vercel (Great for React Apps)

**Why Vercel?**
- Optimized for React/Next.js
- Free tier with generous limits
- Excellent performance
- Easy GitHub integration

**Steps:**

1. **Sign up at [vercel.com](https://vercel.com)**

2. **Install Vercel CLI:**
```bash
npm install -g vercel
```

3. **Build your app:**
```bash
npx expo export -p web
```

4. **Deploy:**
```bash
vercel --prod
```

5. **Your site will be live at:**
   - `https://maceyrunners.vercel.app`

### Option 3: GitHub Pages (Free Static Hosting)

**Why GitHub Pages?**
- Completely free
- Integrated with GitHub
- Good for static sites

**Steps:**

1. **Install gh-pages:**
```bash
npm install --save-dev gh-pages
```

2. **Add to package.json:**
```json
{
  "scripts": {
    "predeploy": "expo export -p web",
    "deploy": "gh-pages -d dist"
  },
  "homepage": "https://yourusername.github.io/maceyrunners"
}
```

3. **Deploy:**
```bash
npm run deploy
```

4. **Enable GitHub Pages:**
   - Go to your repo → Settings → Pages
   - Select `gh-pages` branch
   - Your site will be live at the homepage URL

### Option 4: Firebase Hosting (Google's Solution)

**Why Firebase?**
- Free tier available
- Fast global CDN
- Easy custom domain setup
- Integrated with other Firebase services

**Steps:**

1. **Install Firebase CLI:**
```bash
npm install -g firebase-tools
```

2. **Login to Firebase:**
```bash
firebase login
```

3. **Initialize Firebase:**
```bash
firebase init hosting
```

4. **Configure:**
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

5. **Build and deploy:**
```bash
npx expo export -p web
firebase deploy
```

6. **Your site will be live at:**
   - `https://your-project.web.app`

## 🔧 Configuration for Web

### 1. Update app.json for Web

Ensure your `app.json` has proper web configuration:

```json
{
  "expo": {
    "web": {
      "favicon": "./assets/images/77417a0d-d5f2-4d10-be09-c5caa4ff37f6.jpeg",
      "bundler": "metro",
      "build": {
        "babel": {
          "include": ["@supabase/supabase-js"]
        }
      }
    }
  }
}
```

### 2. Environment Variables

For production, set environment variables in your hosting platform:

**Netlify:**
- Go to Site settings → Environment variables
- Add: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`

**Vercel:**
- Go to Project settings → Environment Variables
- Add the same variables

**Firebase:**
- Use `.env.production` file (not committed to Git)

### 3. Custom Domain Setup

**For any hosting provider:**

1. **Purchase a domain** (e.g., from Namecheap, GoDaddy)

2. **Add DNS records:**
   - For Netlify/Vercel: Add CNAME record pointing to their servers
   - For Firebase: Follow their custom domain setup wizard

3. **Enable HTTPS:**
   - Most providers auto-provision SSL certificates
   - Wait 24-48 hours for DNS propagation

## 📱 Progressive Web App (PWA) Setup

Make your web app installable on mobile devices:

### 1. Create manifest.json

Create `public/manifest.json`:

```json
{
  "name": "MaceyRunners",
  "short_name": "MaceyRunners",
  "description": "Food delivery and errand services in Guyana",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#1E88E5",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 2. Add Service Worker

Expo automatically generates a service worker for caching.

### 3. Test PWA

1. Deploy your site
2. Open in Chrome on mobile
3. Tap "Add to Home Screen"
4. Your app will install like a native app!

## 🔍 SEO Optimization

### 1. Add Meta Tags

Create `public/index.html` with proper meta tags:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="MaceyRunners - Fast food delivery and errand services in Guyana. Order from your favorite restaurants or get help with errands." />
  <meta name="keywords" content="food delivery, errand services, Guyana, Georgetown, delivery app" />
  <meta property="og:title" content="MaceyRunners - Food Delivery & Errand Services" />
  <meta property="og:description" content="Fast food delivery and errand services in Guyana" />
  <meta property="og:image" content="/og-image.png" />
  <title>MaceyRunners - Food Delivery & Errand Services</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
```

### 2. Add robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://yourdomain.com/sitemap.xml
```

## 📊 Analytics Setup

### Google Analytics

1. **Get tracking ID** from [analytics.google.com](https://analytics.google.com)

2. **Add to your app:**

```bash
npm install @react-native-google-analytics/google-analytics
```

3. **Initialize in app:**

```typescript
import { GoogleAnalytics } from '@react-native-google-analytics/google-analytics';

GoogleAnalytics.initialize('YOUR-TRACKING-ID');
```

## 🐛 Troubleshooting

### Issue: White screen on deployment

**Solution:**
- Check browser console for errors
- Ensure all environment variables are set
- Verify Supabase URL is accessible from web

### Issue: Images not loading

**Solution:**
- Use absolute URLs for images
- Check CORS settings on image hosts
- Ensure images are in `public/` folder

### Issue: Authentication not working

**Solution:**
- Add your web domain to Supabase allowed redirect URLs
- Check that cookies are enabled
- Verify OAuth redirect URLs

## 📞 Support

If you encounter issues:
- Check the [Expo Web docs](https://docs.expo.dev/workflow/web/)
- Review hosting provider documentation
- Contact support: errandrunners592@gmail.com

## 🎉 Launch Checklist

Before going live:

- [ ] Test all features on web
- [ ] Verify mobile responsiveness
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Add analytics
- [ ] Test payment flow
- [ ] Verify email notifications work
- [ ] Test on slow internet connection
- [ ] Add social media meta tags
- [ ] Submit to Google Search Console

## 🚀 Post-Launch

After deployment:

1. **Monitor Performance:**
   - Use Google Analytics
   - Check Lighthouse scores
   - Monitor error logs

2. **Promote Your Site:**
   - Share on social media
   - Add to Google My Business
   - Create QR codes for physical locations

3. **Continuous Updates:**
   - Regular security updates
   - Feature improvements based on user feedback
   - Performance optimization

---

**Your web app is now live! 🎊**

Customers can access MaceyRunners from any device at your chosen domain.
