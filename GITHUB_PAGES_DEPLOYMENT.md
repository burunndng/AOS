# GitHub Pages Deployment Guide

This guide explains how to deploy Aura OS to GitHub Pages from feature branches without affecting the Vercel production deployment.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   GitHub Repository                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Main Branch                    Feature Branch            │
│  (production)                   (claude/...)              │
│       │                                │                 │
│       ├─> Vercel Deploy          ├─> GitHub Actions      │
│       │   vercel.com             │   build & test         │
│       │   (Production API)        │                       │
│       │                           └─> GitHub Pages Deploy │
│       │                               github.io/AOS       │
│       │                               (Staging/Testing)   │
│       │                                                    │
│       └─> No impact on                                    │
│           feature branch            No impact on          │
│           deployments               production            │
│                                                            │
└─────────────────────────────────────────────────────────┘
```

## ✅ Setup Requirements

### 1. GitHub Secrets (Settings → Secrets and variables → Actions)

You need to configure these secrets in your GitHub repository:

```
GEMINI_API_KEY              # Required: Google Gemini API key
FEATURE_BRANCH_API_URL      # Optional: Staging API URL (without /api)
FEATURE_BRANCH_COACH_API    # Optional: Staging Coach API endpoint
```

**How to add secrets:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each secret with the values above

### 2. GitHub Pages Settings (Settings → Pages)

Configure GitHub Pages to deploy from the `gh-pages` branch:

1. Go to Settings → Pages
2. Source: Select "Deploy from a branch"
3. Branch: Select `gh-pages`
4. Folder: Select `/ (root)`
5. Save

## 🚀 How It Works

### Automatic Deployment

When you push to **any branch starting with `claude/`**:

1. GitHub Actions workflow is triggered (`.github/workflows/deploy-gh-pages.yml`)
2. Code is built with:
   - `GITHUB_PAGES=true` environment variable
   - Your Gemini API key
   - Staging API endpoints (if configured)
3. Built files uploaded to GitHub Pages
4. Deployed at: `https://yourusername.github.io/AOS/`

### Manual Deployment

If you need to manually trigger deployment:

1. Go to Actions tab in GitHub
2. Select "Deploy Feature Branch to GitHub Pages" workflow
3. Click "Run workflow"
4. Select branch: `claude/fix-ai-practice-coach-011CV3Egetb6sHjp7WYbhjpx`
5. Click "Run workflow"

## 📝 Configuration Details

### Build Configuration (vite.config.ts)

The Vite config automatically detects GitHub Pages deployment:

```typescript
const isGithubPages = process.env.GITHUB_PAGES === 'true';
const base = isGithubPages ? '/AOS/' : '/';
```

- **Local dev**: Uses `/` base path
- **GitHub Pages**: Uses `/AOS/` base path
- **Vercel**: Uses `/` base path (default)

### SPA Routing Support (public/404.html)

GitHub Pages automatically serves `404.html` for non-existent routes. This file redirects to `/AOS/` allowing React Router to handle all routing.

## 🔌 API Integration

### Option A: Use Staging Vercel Deployment

If you have a staging Vercel deployment:

1. Go to GitHub repo → Settings → Secrets
2. Add:
   - `FEATURE_BRANCH_API_URL`: `https://staging-domain.vercel.app`
   - `FEATURE_BRANCH_COACH_API`: `https://staging-domain.vercel.app/api/coach`

### Option B: Use Production API (for testing)

Leave secrets empty to use production API (not recommended for testing breaking changes).

### Option C: Mock API for Testing

Update `src/services/geminiService.ts` to detect GitHub Pages environment and return mock responses.

## 📊 Deployment Status

### Check Deployment Status

1. Go to Actions tab
2. Look for "Deploy Feature Branch to GitHub Pages"
3. Green check ✅ = successful deployment
4. Red X ❌ = deployment failed (check logs)

### View Live Deployment

- **URL**: `https://yourusername.github.io/AOS/`
- **Subdirectory**: Everything served from `/AOS/` subdirectory
- **APIs**: Point to staging/production based on secrets

## 🔒 Safety: Production Not Affected

### What's Protected

✅ **Main branch** → Vercel production (unchanged)
✅ **Main Vercel deployment** (unchanged)
✅ **Production API** (unchanged)
✅ **Production database** (unchanged)

### Feature Branch Isolation

✅ **Feature branch code** → GitHub Pages (temporary)
✅ **Feature branch testing** → Can use staging/production API
✅ **No automatic merge** → Manual PR review required

## 🧪 Testing Workflow

1. **Push feature branch**:
   ```bash
   git push origin claude/fix-ai-practice-coach-011CV3Egetb6sHjp7WYbhjpx
   ```

2. **Wait for GitHub Actions**:
   - Check Actions tab
   - Wait for "Deploy Feature Branch to GitHub Pages" to complete

3. **Visit deployment**:
   ```
   https://yourusername.github.io/AOS/
   ```

4. **Test features**:
   - All client-side features work (localStorage, UI, etc.)
   - API calls work with configured endpoints
   - No production data affected

5. **Create PR**:
   - Create pull request when ready
   - Link to GitHub Pages deployment in PR description
   - Code review + testing
   - Merge to main when approved

## 🗑️ Cleanup

### Delete Deployment

GitHub Pages deployments are temporary:
- Each push to feature branch updates the deployment
- Create new branch from main to reset deployment
- Old branches auto-cleanup after ~30 days

### Delete Secrets (if needed)

Go to Settings → Secrets and delete unused secrets.

## ⚠️ Troubleshooting

### Deployment failed in Actions

1. Check workflow logs (Actions tab)
2. Verify secrets are set (Settings → Secrets)
3. Check `vite.config.ts` build configuration
4. Look for TypeScript/build errors in logs

### Pages not deploying

1. Verify GitHub Pages settings (Settings → Pages)
2. Check branch is `gh-pages`
3. Run workflow manually (Actions → Run workflow)

### API endpoints not working

1. Check `FEATURE_BRANCH_API_URL` secret is set
2. Verify API server is running/deployed
3. Check CORS settings on API
4. Look at browser console for errors

### Routes not working

1. Check `public/404.html` exists
2. Verify base path is `/AOS/` in built assets
3. Check React Router configuration

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [React Router Browser Navigation](https://reactrouter.com/en/main/start/overview)

## 🎯 Next Steps

1. ✅ Add GitHub secrets
2. ✅ Configure GitHub Pages settings
3. ✅ Push feature branch
4. ✅ Test GitHub Pages deployment
5. ✅ Verify API integration
6. ✅ Create pull request
7. ✅ Merge when approved
