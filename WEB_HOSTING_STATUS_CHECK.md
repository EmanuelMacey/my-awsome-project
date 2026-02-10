
# 🌐 Website Hosting Status Check for MaceyRunners

This guide will help you diagnose and fix issues with your website hosting.

---

## 🔍 **Current Status Check**

Based on your project, I can see you have:
- ✅ A `CNAME` file in your project root
- ✅ A `vercel.json` configuration file
- ✅ Web build configuration in `app.json`

Let me help you verify your hosting setup and troubleshoot any issues.

---

## 📋 **Step 1: Check Your CNAME File**

Your CNAME file should contain your custom domain. Let's verify:

**Expected content:**
```
yourdomain.com
```
or
```
www.yourdomain.com
```

**Action:** Check the CNAME file in your project root and ensure it contains your domain name.

---

## 🌍 **Step 2: Verify DNS Configuration**

### If using a custom domain (e.g., maceyrunners.com):

1. **Check DNS Records:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Look for DNS settings
   - Verify you have the correct records

2. **Required DNS Records for Vercel:**

   **Option A: Using www subdomain (Recommended)**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600 (or Auto)
   ```

   **Option B: Using root domain**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600 (or Auto)
   ```

3. **DNS Propagation:**
   - DNS changes can take 24-48 hours to propagate
   - Check propagation status: https://www.whatsmydns.net/
   - Enter your domain and check if it resolves correctly

---

## 🚀 **Step 3: Verify Vercel Deployment**

### Check if your site is deployed on Vercel:

1. **Log into Vercel:**
   - Go to: https://vercel.com/
   - Sign in with your account

2. **Find Your Project:**
   - Look for "MaceyRunners" in your projects list
   - Click on it to view deployment details

3. **Check Deployment Status:**
   - ✅ **Success:** Green checkmark, site is live
   - ⏳ **Building:** Yellow indicator, wait for completion
   - ❌ **Failed:** Red X, check error logs

4. **View Deployment URL:**
   - Vercel provides a default URL: `maceyrunners.vercel.app`
   - Test this URL first to ensure the app works
   - If this works but your custom domain doesn't, it's a DNS issue

### If Project is NOT on Vercel:

You need to deploy it first. Follow the deployment steps below.

---

## 📦 **Step 4: Deploy to Vercel (If Not Already Deployed)**

### Option A: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Build Your Web App:**
   ```bash
   npm run build:web
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   ```

5. **Follow Prompts:**
   - Set up and deploy: Yes
   - Which scope: Your account
   - Link to existing project: No (first time) or Yes (updating)
   - Project name: MaceyRunners
   - Directory: ./web-build (or ./dist)

### Option B: Deploy via Vercel Dashboard

1. **Go to Vercel Dashboard:**
   - https://vercel.com/new

2. **Import Git Repository:**
   - Click "Import Project"
   - Connect your GitHub account
   - Select your MaceyRunners repository

3. **Configure Project:**
   - Framework Preset: Other
   - Build Command: `npm run build:web`
   - Output Directory: `web-build` (or `dist`)
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (5-10 minutes)

---

## 🔧 **Step 5: Configure Custom Domain on Vercel**

Once your site is deployed on Vercel:

1. **Go to Project Settings:**
   - Vercel Dashboard → Your Project → Settings

2. **Add Custom Domain:**
   - Click "Domains" in the sidebar
   - Click "Add"
   - Enter your domain: `maceyrunners.com` or `www.maceyrunners.com`
   - Click "Add"

3. **Verify Domain:**
   - Vercel will check your DNS records
   - If correct, domain will be verified
   - If incorrect, Vercel will show what records to add

4. **Wait for SSL Certificate:**
   - Vercel automatically provisions SSL (HTTPS)
   - This can take a few minutes
   - Once ready, your site will be accessible via HTTPS

---

## 🐛 **Step 6: Common Issues & Fixes**

### Issue 1: "This site can't be reached" or "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** DNS records are not configured correctly or haven't propagated yet.

**Fix:**
1. Verify DNS records in your domain registrar
2. Ensure CNAME points to `cname.vercel-dns.com`
3. Wait 24-48 hours for DNS propagation
4. Clear your browser cache and DNS cache:
   - Windows: `ipconfig /flushdns`
   - Mac: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`
   - Linux: `sudo systemd-resolve --flush-caches`

### Issue 2: "404 - Page Not Found"

**Cause:** Vercel is serving the site, but routing is not configured correctly.

**Fix:**
1. Check your `vercel.json` configuration
2. Ensure it has proper rewrites for Expo Router:
   ```json
   {
     "rewrites": [
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Redeploy your site

### Issue 3: "ERR_SSL_VERSION_OR_CIPHER_MISMATCH"

**Cause:** SSL certificate is not yet provisioned or has an issue.

**Fix:**
1. Wait a few minutes for Vercel to provision SSL
2. Check domain settings in Vercel Dashboard
3. Remove and re-add the domain if issue persists

### Issue 4: Site loads but shows blank page

**Cause:** Build errors or incorrect build configuration.

**Fix:**
1. Check Vercel build logs for errors
2. Test the build locally:
   ```bash
   npm run build:web
   npx serve web-build
   ```
3. Open http://localhost:3000 and check for errors in browser console
4. Fix any errors and redeploy

### Issue 5: "This domain is not registered on Vercel"

**Cause:** Domain is not added to your Vercel project.

**Fix:**
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow verification steps

---

## 🧪 **Step 7: Test Your Website**

Once deployed, test these URLs:

1. **Vercel Default URL:**
   - `https://maceyrunners.vercel.app`
   - Should work immediately after deployment

2. **Custom Domain (if configured):**
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`
   - Should work after DNS propagation

3. **Test Functionality:**
   - [ ] Home page loads
   - [ ] Navigation works
   - [ ] Images load correctly
   - [ ] Forms work (login, registration)
   - [ ] API calls work (check browser console for errors)

---

## 📊 **Step 8: Monitor Your Website**

### Vercel Analytics:
- Go to Vercel Dashboard → Your Project → Analytics
- View page views, performance metrics, and errors

### Check Uptime:
- Use a service like UptimeRobot (free): https://uptimerobot.com/
- Set up monitoring for your domain
- Get alerts if site goes down

### Performance:
- Test with Google PageSpeed Insights: https://pagespeed.web.dev/
- Test with GTmetrix: https://gtmetrix.com/
- Aim for scores above 90

---

## 🔐 **Step 9: Security & Best Practices**

### Enable HTTPS:
- ✅ Vercel automatically provides SSL
- Ensure all links use HTTPS
- Redirect HTTP to HTTPS (Vercel does this automatically)

### Set Security Headers:
Add to your `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Environment Variables:
- Store sensitive data (API keys) in Vercel Environment Variables
- Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
- Add variables like `SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.

---

## 📞 **Step 10: Get Help**

If you're still having issues:

### Vercel Support:
- Documentation: https://vercel.com/docs
- Community: https://github.com/vercel/vercel/discussions
- Support: https://vercel.com/support

### DNS Support:
- Contact your domain registrar's support
- Provide them with the DNS records you need to set

### Check Status Pages:
- Vercel Status: https://www.vercel-status.com/
- Check if there are any ongoing outages

---

## ✅ **Quick Diagnostic Checklist**

Run through this checklist to identify your issue:

- [ ] Is your site deployed on Vercel? (Check Vercel Dashboard)
- [ ] Does the Vercel default URL work? (e.g., maceyrunners.vercel.app)
- [ ] Is your custom domain added in Vercel? (Settings → Domains)
- [ ] Are your DNS records correct? (Check domain registrar)
- [ ] Has DNS propagated? (Check https://www.whatsmydns.net/)
- [ ] Is SSL certificate active? (Check for HTTPS padlock in browser)
- [ ] Are there any errors in Vercel build logs?
- [ ] Are there any errors in browser console? (F12 → Console tab)

---

## 🎯 **Expected Results**

After following this guide, you should have:

✅ Website deployed on Vercel
✅ Custom domain configured (if applicable)
✅ HTTPS enabled
✅ Site accessible from anywhere
✅ No errors in browser console
✅ Fast load times (<3 seconds)

---

## 📝 **Next Steps**

Once your website is live:

1. **Update App Store Links:**
   - Add website URL to App Store Connect
   - Add website URL to Google Play Console

2. **SEO Optimization:**
   - Add meta tags for better search engine visibility
   - Submit sitemap to Google Search Console

3. **Analytics:**
   - Set up Google Analytics
   - Track user behavior and conversions

4. **Marketing:**
   - Share website link on social media
   - Add to email signatures
   - Create QR codes for physical marketing

---

**Need more help?** Check the Vercel documentation or contact their support team. They're very responsive and helpful!
