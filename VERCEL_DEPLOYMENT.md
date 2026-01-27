# 🚀 Vercel Deployment Guide

## Prerequisites

1. ✅ **Supabase Database Setup**
   - Import `DATABASE_SCHEMA.sql` into your Supabase project
   - Verify all tables are created successfully

2. ✅ **GitHub Repository**
   - Code is already pushed to: https://github.com/BeCreativeRuben/AccountingSoftwareDietitians

## Step-by-Step Deployment

### 1. Connect Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `BeCreativeRuben/AccountingSoftwareDietitians`
4. Vercel will auto-detect it's a Next.js project ✅

### 2. Configure Environment Variables

In the Vercel project settings, add these environment variables:

**Required Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

**Note:** Get these values from your Supabase project settings (Settings → API)

**Optional Variables (for future features):**

```
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-app.vercel.app
CRON_SECRET=your-cron-secret-key
```

**How to add in Vercel:**
1. Go to **Settings** → **Environment Variables**
2. Add each variable (make sure to select all environments: Production, Preview, Development)
3. Click **Save**

### 3. Build Settings (Auto-detected)

Vercel will automatically detect:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (auto)
- **Install Command:** `npm install`

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will:
   - Install dependencies
   - Run `npm run build`
   - Deploy to a production URL

### 5. Post-Deployment

**Update NEXTAUTH_URL (if using NextAuth):**
- After deployment, update `NEXTAUTH_URL` to your Vercel URL:
  ```
  NEXTAUTH_URL=https://your-app-name.vercel.app
  ```

**Test the deployment:**
- Visit your Vercel URL
- Try signing up a new user
- Verify database connection works

## 🔧 Configuration Files

### `vercel.json` (Optional)
Already created - provides explicit configuration for Vercel.

### `next.config.ts`
Already configured - no changes needed.

## 📝 Important Notes

1. **Environment Variables:**
   - `NEXT_PUBLIC_*` variables are exposed to the browser
   - `SUPABASE_SERVICE_ROLE_KEY` is server-only (safe)
   - Never commit `.env.local` to git ✅ (already in .gitignore)

2. **Database:**
   - Make sure Supabase database schema is imported BEFORE deploying
   - Test locally first with `npm run dev`

3. **Build Errors:**
   - If build fails, check Vercel build logs
   - Common issues: missing environment variables, TypeScript errors

4. **Custom Domain (Optional):**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Update DNS records as instructed

## 🚨 Troubleshooting

**Build fails:**
- Check environment variables are set correctly
- Verify Supabase URL and keys are correct
- Check build logs in Vercel dashboard

**Database connection fails:**
- Verify Supabase project is active
- Check RLS (Row Level Security) policies if needed
- Verify service role key has correct permissions

**Authentication not working:**
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase Auth is enabled in Supabase dashboard

## ✅ Deployment Checklist

- [ ] Supabase database schema imported
- [ ] Environment variables added to Vercel
- [ ] Repository connected to Vercel
- [ ] Build successful
- [ ] Test signup/login on deployed site
- [ ] Verify database writes work

---

**Your app will be live at:** `https://your-app-name.vercel.app`
