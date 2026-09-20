# Jhun Lester Cervantes — Portfolio

A responsive portfolio with an AI assistant, GitHub activity, project search, themes, and a face that follows the cursor while the body stays still. Built with HTML, CSS and JavaScript; the Gemini connection runs in a server function.

## Deploy through GitHub and Vercel — no terminal commands needed

1. Upload this repository to GitHub, including `api/`, `scripts/`, `img/`, `package.json`, and `vercel.json`. Do not upload only `index.html` or `dist/`.
2. In Vercel, choose **Add New → Project → Import** your GitHub repository. Select the branch containing these changes and the repository root as the Root Directory. Framework Preset: **Other**. The included configuration supplies the build command (`npm run build`) and output directory (`dist`); Vercel runs these automatically.
3. In the import screen's **Environment Variables**, add `GEMINI_API_KEY` with a fresh key. Keys shared in chat should be revoked and replaced. Never put a key in HTML, JavaScript, GitHub, or a public-prefixed environment variable. Gemini free-tier availability and quotas depend on your Google project and model.
4. Click **Deploy**. Vercel publishes the page and the `api/chat.js` function together. Later pushes to your production branch automatically redeploy. If you add or change an environment variable after deployment, redeploy for it to take effect.
5. Optional variables: `GEMINI_MODEL` (default `gemini-3.5-flash`), `SITE_URL` (your preferred full HTTPS domain), and `GOOGLE_SITE_VERIFICATION` (Search Console's verification token).

No model download or browser GPU is required. Messages go through the same-origin `/api/chat` endpoint to Gemini. Messages are processed according to Google’s Gemini API terms and your project settings. The app does not save chat history to a database. The endpoint validates messages, caps output and request frequency per process, and returns generic service errors without exposing credentials. Configure a shared rate limit with your hosting gateway if scaling to multiple instances, and set an API project budget appropriate for a public assistant.

## Search discovery

Production Vercel builds automatically use `VERCEL_PROJECT_PRODUCTION_URL` for canonical links, social previews, the Person profile URL, `robots.txt`, and `sitemap.xml`. `SITE_URL` can override it for a custom domain. Preview deployments stay `noindex` so temporary copies do not compete with the main site. Ensure Vercel's system environment variables are exposed to builds (the default), and that the production site is publicly accessible without sign-in.

After deploying, add the public URL to Google Search Console, verify ownership (set `GOOGLE_SITE_VERIFICATION` and redeploy if using its HTML-tag method), submit `sitemap.xml`, and request indexing for the homepage. Your full name is in the title, main heading, description and structured data. Google decides when to index and rank it; deployment cannot guarantee immediate search results. This is search-engine optimization (SEO); a subscription SaaS system is not needed for name searches.

Official guides: https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl and https://vercel.com/docs/environment-variables/system-environment-variables

## Optional local development

Node.js 24 is supported. Copy `.env.example` to `.env.local`, fill in the local key, then use `npm run dev`. This is only for local development, not a step visitors or Vercel users need to perform. `npm run check` runs asset, API, calendar and production/preview metadata checks. `npm run build` creates static assets; `npm run preview` serves them with the local API endpoint. Without a public production URL, local builds are intentionally not indexed.

The original page remains in `legacy-index.html` and `legacy-index.css`, excluded from production. GitHub contributions come from the public `github-contributions-api.jogruber.de` feed for `Jhester11`, with error handling rather than fabricated counts. The photo effect uses nine AI-generated head angles in `img/portrait-directions.png`, with a continuous head and neck blended into a fixed torso from the center frame. Short transitions and boundary hysteresis prevent abrupt switching and jitter. The original photo is only a loading/failure fallback, never an underlying second head. These are inferred views, not additional photographs. Touch and reduced-motion users see a still center pose. `.openai/hosting.json` is an earlier hosting integration and is not used by Vercel.

VS Code Live Server on port 5500 uses the local API bridge at 127.0.0.1:4175. This bridge must be running for local AI replies; Vercel automatically uses its own /api/chat function. A valid Gemini key with available quota is required in either case. Local .env.local secrets are ignored by Git and excluded from dist.
