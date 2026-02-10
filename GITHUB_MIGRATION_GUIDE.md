
# GitHub Migration Guide for ErrandRunners

This guide will help you migrate your ErrandRunners project to GitHub.

## Prerequisites

1. **Install Git** (if not already installed):
   - **Windows**: Download from https://git-scm.com/download/win
   - **Mac**: Run `git --version` in Terminal (will prompt to install if needed)
   - **Linux**: Run `sudo apt-get install git` (Ubuntu/Debian) or `sudo yum install git` (CentOS/Fedora)

2. **Create a GitHub Account**: Go to https://github.com and sign up if you don't have an account.

3. **Create a New Repository on GitHub**:
   - Go to https://github.com/new
   - Repository name: `errandrunners-app` (or your preferred name)
   - Description: "ErrandRunners - All-in-one delivery app"
   - Choose **Private** (recommended) or Public
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

## Step-by-Step Migration

### Step 1: Open Terminal/Command Prompt

Navigate to your project directory:

```bash
cd /path/to/your/errandrunners-project
```

### Step 2: Initialize Git Repository (if not already done)

```bash
git init
```

### Step 3: Add All Files to Git

```bash
git add .
```

### Step 4: Create Your First Commit

```bash
git commit -m "Initial commit: ErrandRunners delivery app"
```

### Step 5: Add GitHub as Remote Repository

Replace `YOUR_USERNAME` with your actual GitHub username and `REPO_NAME` with your repository name:

```bash
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

Example:
```bash
git remote add origin https://github.com/johndoe/errandrunners-app.git
```

### Step 6: Verify Remote Was Added

```bash
git remote -v
```

You should see:
```
origin  https://github.com/YOUR_USERNAME/REPO_NAME.git (fetch)
origin  https://github.com/YOUR_USERNAME/REPO_NAME.git (push)
```

### Step 7: Push to GitHub

For the first push, use:

```bash
git branch -M main
git push -u origin main
```

If you're prompted for credentials:
- **Username**: Your GitHub username
- **Password**: Use a **Personal Access Token** (not your GitHub password)

### Step 8: Create a Personal Access Token (if needed)

If GitHub asks for a password and rejects it:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "ErrandRunners App"
4. Select scopes: Check **repo** (full control of private repositories)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again)
7. Use this token as your password when pushing

### Step 9: Verify Upload

Go to your GitHub repository URL:
```
https://github.com/YOUR_USERNAME/REPO_NAME
```

You should see all your project files!

## Common Issues and Solutions

### Issue 1: "fatal: remote origin already exists"

**Solution**: Remove the existing remote and add it again:
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

### Issue 2: "Support for password authentication was removed"

**Solution**: You need to use a Personal Access Token instead of your password (see Step 8 above).

### Issue 3: "failed to push some refs"

**Solution**: Pull first, then push:
```bash
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### Issue 4: Large files causing push to fail

**Solution**: Check if you have large files (like node_modules):
```bash
# Make sure .gitignore includes:
node_modules/
.expo/
dist/
build/
*.log

# Remove cached files:
git rm -r --cached node_modules
git commit -m "Remove node_modules from tracking"
git push
```

### Issue 5: "Permission denied (publickey)"

**Solution**: Use HTTPS instead of SSH, or set up SSH keys:
```bash
# Switch to HTTPS:
git remote set-url origin https://github.com/YOUR_USERNAME/REPO_NAME.git
```

## Future Updates

After the initial setup, to push changes:

```bash
# 1. Check what changed
git status

# 2. Add changes
git add .

# 3. Commit with a message
git commit -m "Description of changes"

# 4. Push to GitHub
git push
```

## Recommended .gitignore

Make sure your `.gitignore` file includes:

```
# Dependencies
node_modules/
.pnp
.pnp.js

# Expo
.expo/
.expo-shared/
dist/
web-build/

# Environment variables
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Build
build/
android/app/build/
ios/Pods/
```

## Protecting Sensitive Information

**CRITICAL**: Never commit sensitive data to GitHub!

1. **Check your .env file is in .gitignore**:
   ```bash
   cat .gitignore | grep .env
   ```

2. **If you accidentally committed .env**:
   ```bash
   git rm --cached .env
   git commit -m "Remove .env from tracking"
   git push
   ```

3. **Rotate your API keys** if they were exposed:
   - Generate new Supabase keys
   - Update your local .env file
   - Update environment variables in Expo/EAS

## Next Steps

1. ✅ Set up branch protection rules on GitHub
2. ✅ Add collaborators (Settings → Collaborators)
3. ✅ Set up GitHub Actions for CI/CD (optional)
4. ✅ Create a README.md with project documentation
5. ✅ Add issue templates for bug reports and feature requests

## Need Help?

If you encounter issues not covered here:

1. Check the error message carefully
2. Search GitHub's documentation: https://docs.github.com
3. Search Stack Overflow: https://stackoverflow.com/questions/tagged/git
4. Contact support with the specific error message

---

**Congratulations!** Your ErrandRunners project is now on GitHub! 🎉
