# FileBin - Deployment Guide

This guide will help you deploy your FileBin anonymous file sharing service from GitHub to various hosting platforms.
Anonymous, Fast, Secure, & Free File Sharing service.

## Prerequisites

- GitHub account
- Node.js 18+
- Git installed locally
- A hosting platform account (Vercel, Railway, Render, etc.)

## Deployment Options

### Option 1: Deploy to Vercel (Recommended)

Vercel is great for full-stack applications and handles both frontend and backend seamlessly.

#### Step 1: Prepare Your Repository
1. Push your code to a GitHub repository
2. Ensure your `package.json` has the correct scripts:
   ```json
   {
     "scripts": {
       "build": "npm run build:client",
       "build:client": "vite build --outDir dist/client",
       "start": "NODE_ENV=production tsx server/index.ts",
       "dev": "NODE_ENV=development tsx server/index.ts"
     }
   }
   ```

#### Step 2: Configure Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project" and import your repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist/client`
   - **Install Command**: `npm install`

#### Step 3: Environment Variables
In Vercel dashboard, add these environment variables:
- `NODE_ENV`: `production`
- `DATABASE_URL`: Your PostgreSQL connection string
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`: Your Google Cloud Storage bucket ID
- `PUBLIC_OBJECT_SEARCH_PATHS`: Your public object paths
- `PRIVATE_OBJECT_DIR`: Your private object directory

#### Step 4: Deploy
1. Click "Deploy" in Vercel
2. Your app will be live at `https://your-app-name.vercel.app`

### Option 2: Deploy to Railway

Railway is excellent for full-stack apps with database integration.

#### Step 1: Setup Railway
1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your FileBin repository

#### Step 2: Configure Build
Railway auto-detects Node.js apps. Ensure your `package.json` has:
```json
{
  "scripts": {
    "build": "vite build --outDir dist/client",
    "start": "NODE_ENV=production tsx server/index.ts"
  }
}
```

#### Step 3: Add Database
1. In Railway dashboard, click "+ New"
2. Select "PostgreSQL"
3. Railway will provide a `DATABASE_URL` automatically

#### Step 4: Environment Variables
Add these in Railway's Variables tab:
- `NODE_ENV`: `production`
- `PORT`: `$PORT` (Railway provides this automatically)
- Object storage variables (see Google Cloud Setup below)

### Option 3: Deploy to Render

#### Step 1: Create Web Service
1. Go to [render.com](https://render.com) and connect GitHub
2. Click "New Web Service"
3. Select your repository

#### Step 2: Configure Service
- **Name**: `filebin`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Step 3: Add PostgreSQL
1. Create a new PostgreSQL database in Render
2. Copy the connection string to your environment variables

## Database Setup

### PostgreSQL Database
You'll need a PostgreSQL database. Options include:

1. **Neon** (Recommended - Serverless PostgreSQL)
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Supabase**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Use the PostgreSQL connection string

3. **Railway PostgreSQL** (if using Railway)
   - Automatically provisioned

### Database Schema
Your hosting platform should automatically run migrations. The schema includes:
```sql
CREATE TABLE files (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  object_path TEXT NOT NULL,
  share_id TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now() NOT NULL
);
```

## Google Cloud Storage Setup

### Step 1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Cloud Storage API

### Step 2: Create Storage Bucket
1. Go to Cloud Storage → Buckets
2. Click "Create Bucket"
3. Choose a globally unique name (e.g., `filebin-storage-yourname`)
4. Select region and storage class
5. Set permissions to "Fine-grained"

### Step 3: Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Give it a name (e.g., `filebin-storage`)
4. Grant these roles:
   - Storage Object Admin
   - Storage Object Creator
   - Storage Object Viewer

### Step 4: Generate Key
1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose JSON format
5. Download the key file

### Step 5: Configure Environment Variables
Add to your hosting platform:
```
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-name
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket-name/public
PRIVATE_OBJECT_DIR=/your-bucket-name/.private
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account",...} // Contents of JSON key
```

## Local Development from GitHub

### Step 1: Clone Repository
```bash
git clone https://github.com/yourusername/filebin.git
cd filebin
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Environment Variables
Create `.env` file:
```env
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/filebin
DEFAULT_OBJECT_STORAGE_BUCKET_ID=your-bucket-id
PUBLIC_OBJECT_SEARCH_PATHS=/your-bucket/public
PRIVATE_OBJECT_DIR=/your-bucket/.private
```

### Step 4: Database Setup
```bash
# If using Drizzle migrations
npx drizzle-kit push:pg
```

### Step 5: Start Development
```bash
npm run dev
```

## Production Build

### Build Assets
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Configure CORS for your domain in production
3. **Rate Limiting**: Consider adding rate limiting for uploads
4. **File Size Limits**: Ensure proper file size validation
5. **Storage Costs**: Monitor Google Cloud Storage usage

## Monitoring & Logs

### Vercel
- View logs in Vercel dashboard
- Set up monitoring with Vercel Analytics

### Railway
- Built-in logging and metrics
- Configure alerts for errors

### Render
- Access logs via dashboard
- Set up health checks

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (use 18+)
   - Verify all dependencies are in `package.json`
   - Check build logs for specific errors

2. **Database Connection**
   - Verify `DATABASE_URL` format
   - Ensure database is accessible from hosting platform
   - Check firewall settings

3. **Object Storage**
   - Verify Google Cloud credentials
   - Check bucket permissions
   - Ensure bucket exists and is accessible

4. **Environment Variables**
   - Double-check all required variables are set
   - Verify no typos in variable names
   - Restart deployment after adding variables

### Getting Help
- Check hosting platform documentation
- Review application logs
- Test locally first to isolate issues

## Scaling Considerations

- **CDN**: Use Cloudflare or similar for file delivery
- **Database**: Consider connection pooling for high traffic
- **Storage**: Monitor Google Cloud Storage costs
- **Caching**: Implement Redis for session management
- **Load Balancing**: Use multiple instances for high availability

---

## Success!

Once deployed, your FileBin service will be available at your hosting platform's provided URL. Users can upload files anonymously and share them instantly with automatic cleanup!

Remember to:
- Monitor storage usage and costs
- Set up backups for your database
- Keep dependencies updated
- Monitor application performance
Share files instantly without signing up. No tracking, no ads, no limits. Whether you're sending documents, images, or large media, FileBin makes it effortless and private. Just upload, get a link, and share. Your data is encrypted, stored, and automatically deleted after a set time of your choice.
No names. No logs. Just pure file transfer.
