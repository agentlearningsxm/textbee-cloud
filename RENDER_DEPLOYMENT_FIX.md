# Render Deployment Fix - Complete Guide

## Problem Summary

The textbee-api service was failing on Render with "Exited with status 1" error. The root causes were:

1. **Missing `start:prod` script** - Procfile referenced a non-existent script
2. **Package manager mismatch** - Procfile used `npm` but repo uses `pnpm`
3. **No explicit Render configuration** - Render couldn't detect the monorepo structure properly
4. **Missing Node version specification** - Inconsistent Node versions could cause issues

## Root Cause Analysis

### Issue 1: Missing start:prod Script
**File**: `api/Procfile`
```
web: npm run start:prod
```

**Problem**: `package.json` didn't have a `start:prod` script, only `start`, `start:dev`, and `start:debug`.

**Solution**: Added `start:prod` script to `api/package.json`:
```json
"start:prod": "node dist/main.js"
```

### Issue 2: Package Manager Mismatch
**Problem**: Repository migrated from npm to pnpm (commit 6ebe352 from May 2023), but Procfile still used `npm` commands.

**Solution**:
- Updated Procfile to use `pnpm run start:prod`
- Added `packageManager: "pnpm@8.0.0"` to package.json for explicit declaration

### Issue 3: Monorepo Structure Not Recognized
**Problem**: Render was deploying from repo root, but the actual API code is in `/api` subdirectory.

**Solution**: Created `render.yaml` at repo root to explicitly configure:
- Root directory: `api`
- Build command: `pnpm install && pnpm run build`
- Start command: `pnpm run start:prod`

### Issue 4: Node Version Inconsistency
**Problem**: No explicit Node version specified, could lead to compatibility issues.

**Solution**: Created `api/.nvmrc` file with Node 18 (matching CI/CD configuration).

## Changes Made

### 1. api/package.json
```diff
{
  "name": "sms-gateway-backend",
  "version": "0.0.1",
+ "packageManager": "pnpm@8.0.0",
  "scripts": {
    "start": "node dist/main.js",
+   "start:prod": "node dist/main.js",
    ...
  }
}
```

### 2. api/Procfile
```diff
- web: npm run start:prod
+ web: pnpm run start:prod
```

### 3. render.yaml (NEW)
Created comprehensive Render configuration:
```yaml
services:
  - type: web
    name: textbee-api
    env: node
    rootDir: api
    buildCommand: pnpm install && pnpm run build
    startCommand: pnpm run start:prod
    envVars:
      - key: PNPM_VERSION
        value: "8.15.0"
```

### 4. api/.nvmrc (NEW)
```
18
```

## Deployment Instructions

### Option A: Using render.yaml (Recommended)

1. **Commit all changes**:
   ```bash
   git add api/package.json api/Procfile api/.nvmrc render.yaml
   git commit -m "fix: Configure Render for pnpm monorepo deployment

- Add missing start:prod script to package.json
- Update Procfile to use pnpm instead of npm
- Add render.yaml for explicit service configuration
- Add .nvmrc to specify Node 18
- Declare packageManager in package.json

Fixes deployment failures caused by package manager mismatch and missing scripts."
   git push origin main
   ```

2. **Update Render Service Settings**:
   - Go to Render Dashboard → textbee-api service
   - Settings → Build & Deploy
   - **Root Directory**: `api`
   - **Build Command**: `pnpm install && pnpm run build`
   - **Start Command**: `pnpm run start:prod`
   - Environment Variables → Add: `PNPM_VERSION=8.15.0`

3. **Trigger Manual Deploy**:
   - Click "Manual Deploy" → "Deploy latest commit"

### Option B: Manual Render Configuration (If render.yaml doesn't work)

1. Commit changes (without render.yaml):
   ```bash
   git add api/package.json api/Procfile api/.nvmrc
   git commit -m "fix: Add missing start:prod script and configure pnpm"
   git push origin main
   ```

2. **Update Render Service Manually**:
   - Dashboard → textbee-api
   - Settings → Build & Deploy:
     - **Root Directory**: `api`
     - **Build Command**: `pnpm install && pnpm run build`
     - **Start Command**: `pnpm run start:prod`

   - Settings → Environment:
     - Add: `PNPM_VERSION` = `8.15.0`
     - Add: `NODE_VERSION` = `18`

3. **Save and Deploy**

## Verification Steps

After deployment:

1. **Check Build Logs**:
   - Should see: "Installing dependencies using pnpm..."
   - Should see: "Running build command: pnpm install && pnpm run build"
   - No "command not found" errors

2. **Check Runtime Logs**:
   - Should see: "Starting service with: pnpm run start:prod"
   - Application should start successfully
   - Health check should pass

3. **Test API Endpoint**:
   ```bash
   curl https://textbee-api.onrender.com/health
   ```

## Troubleshooting

### If deployment still fails:

1. **Check Render Build Logs** for exact error message

2. **Verify pnpm is being used**:
   - Look for "Detected pnpm-lock.yaml" in logs
   - Should NOT see "Detected package-lock.json"

3. **Verify correct directory**:
   - Build should run in `/api` directory
   - Should see "Building NestJS application..."

4. **Check environment variables**:
   - All required env vars set in Render dashboard
   - No missing DATABASE_URL, JWT_SECRET, etc.

5. **Common issues**:
   - **"start:prod not found"** → package.json wasn't updated
   - **"pnpm: command not found"** → PNPM_VERSION env var not set
   - **"Cannot find module"** → Build didn't complete, check build command
   - **"Port already in use"** → Start command issue, verify Procfile

## Previous Failed Attempts

Based on commit history, previous attempts included:
- 9c71692: "fix: Remove pnpm-lock.yaml files..." ❌ WRONG APPROACH
  - Removing lock files is never the solution
  - Lock files are essential for reproducible builds

The issue was never about the lock files themselves, but about:
1. Missing scripts in package.json
2. Package manager mismatch in Procfile
3. Lack of explicit Render configuration

## Key Learnings

1. **Never remove lock files** - They ensure consistent dependencies
2. **Monorepo requires explicit configuration** - Can't rely on auto-detection
3. **Package manager must be consistent** - Procfile, package.json, CI/CD all must match
4. **Render needs explicit instructions** - Use render.yaml or manual config
5. **Node version matters** - Always specify via .nvmrc or env var

## Rollback Plan

If this fix doesn't work:

```bash
# Rollback changes
git revert HEAD
git push origin main

# Or restore to known working state
git checkout 78025eb  # Last known commit before deployment issues
git checkout -b deployment-fix-v2
```

## Success Criteria

✅ Deployment completes without errors
✅ Service starts and health check passes
✅ No "command not found" errors in logs
✅ pnpm is used (not npm) - visible in build logs
✅ Application responds to HTTP requests
✅ No restart loops or crashes

---

**Date**: 2026-01-30
**Author**: Claude Code
**Issue**: Render deployment failures (srv-d5ffgfshg0os73f9mdp0)
**Status**: Fixes implemented, ready for deployment
