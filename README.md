# Bounce Game - GitHub/Vercel AI Build

This build includes the browser game plus the Vercel serverless AI route.

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
