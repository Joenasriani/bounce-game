# Old Bounce

Browser-based version of Old Bounce.

Play:
https://joenasr.itch.io/bounce

This repository contains the game implementation together with its Vercel serverless route for AI-backed functionality.

The frontend runs in the browser, while API credentials and model access remain server-side through Vercel environment variables.

## Deploy
1. Upload the contents of this folder to GitHub.
2. Deploy with Vercel.
3. Add environment variables in Vercel:
   - OPENROUTER_API_KEY
   - AI_MODEL=openrouter/free or your preferred OpenRouter model

## Font
This build uses one remote rounded web font only: Fredoka from Google Fonts.
No local .otf font files are required.
If Google Fonts is unavailable, the game falls back to rounded/system fonts.

The API key must stay in Vercel environment variables only. Do not place it in index.html.
