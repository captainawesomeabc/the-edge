# Prova — Synthetic Audience Intelligence

Simulate how real people react to your product before you launch. 7 AI personas give honest feedback, then Prova synthesizes a full go-to-market strategy.

## Deploy to Vercel (Free, 2 minutes)

### Step 1: Push to GitHub
Upload this folder to a GitHub repo (or push to an existing one).

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Select your repo
4. Before clicking Deploy, add your environment variable:
   - Click **"Environment Variables"**
   - Name: `OPENAI_API_KEY`
   - Value: your OpenAI API key (from [platform.openai.com/api-keys](https://platform.openai.com/api-keys))
5. Click **Deploy**

That's it! You'll get a live URL like `your-project.vercel.app`.

### Custom Domain (Optional)
In Vercel dashboard → Settings → Domains → Add your domain.

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
npm run dev
```

## Tech Stack
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- OpenAI GPT-4o
- Vercel (deployment)
