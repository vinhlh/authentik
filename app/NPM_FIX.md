# NPM Cache Permission Issue - Quick Fix Guide

## Problem

You're encountering this error:
```
npm ERR! EACCES: permission denied
npm ERR! path /Users/v.le.2/.npm/_cacache/...
```

This happens because some files in your npm cache are owned by root instead of your user account.

## Solution Options

### Option 1: Automated Script (Recommended)

Run the provided installation script:

```bash
./install-deps.sh
```

This will:
1. Fix npm cache permissions (requires your password)
2. Clean the npm cache
3. Install all dependencies
4. Verify the installation

### Option 2: Manual Steps

If the script doesn't work, follow these steps:

#### Step 1: Fix Permissions
```bash
sudo chown -R $(whoami) ~/.npm
```

Enter your password when prompted.

#### Step 2: Clean Cache
```bash
npm cache clean --force
```

#### Step 3: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Option 3: Use Yarn Instead

If npm continues to have issues, you can use yarn:

```bash
# Install yarn if you don't have it
npm install -g yarn

# Install dependencies with yarn
yarn install
```

## Verify Installation

After installation, verify everything is working:

```bash
# Check if node_modules exists
ls -la node_modules

# Try running the dev server
npm run dev
```

## Still Having Issues?

If you're still encountering problems:

1. **Check Node.js version**: Make sure you have Node.js 20+
   ```bash
   node --version
   ```

2. **Remove node_modules and try again**:
   ```bash
   rm -rf node_modules package-lock.json
   npm install --legacy-peer-deps
   ```

3. **Use a different npm registry**:
   ```bash
   npm config set registry https://registry.npmjs.org/
   npm install --legacy-peer-deps
   ```

## Next Steps

Once dependencies are installed:

1. ✅ Copy `.env.local.example` to `.env.local`
2. ✅ Set up Supabase project and add credentials
3. ✅ Get Mapbox token and add to `.env.local`
4. ✅ Run `npm run dev`
5. ✅ Open http://localhost:3000

See [SETUP.md](./SETUP.md) for detailed setup instructions.
