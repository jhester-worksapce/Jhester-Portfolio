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

VS Code Live Server on port 5500 uses the local API bridge at 127.0.0.1:4173. This bridge must be running for local AI replies; Vercel automatically uses its own /api/chat function. A valid Gemini key with available quota is required in either case. Local .env.local secrets are ignored by Git and excluded from dist.

## Troubleshooting the deployed chat

“Chat is not configured yet” means the deployed server has no key. Pushing files to GitHub does not transfer `.env.local` to Vercel.

1. Open your portfolio project in Vercel → Settings → Environment Variables.
2. Set `GEMINI_API_KEY` to the actual key from Google AI Studio, with **Production** selected (also select Preview if you want to test preview deployments). A Google project name or project number is not an API key. `GOOGLE_API_KEY` is accepted as a fallback; `GEMINI_API_KEY` takes precedence in this app.
3. Redeploy from Deployments. Existing deployments do not pick up new variables automatically.
4. Open the deployed portfolio, choose Ask anything, and ask about projects. If the service reports a usage limit, check Gemini project quota; if it reports unavailable, check the key's access and `GEMINI_MODEL`.

Do not paste credentials into the portfolio files. Replace the key shared in chat in Google AI Studio and enter its replacement directly in Vercel.

## Interaction updates

Ask anything opens a dark, full-screen question overlay; Alt+K opens it from the keyboard. Ctrl/Cmd+K still opens portfolio search. Alt+J opens a 30-second typing test with WPM, current-text accuracy, restart, and optional typing sounds. Closing the test cancels it; reopening starts fresh. System, light, and dark appearance choices are saved locally. Chat history remains in memory and clears on reload.

The reference's live visitor count and shared community chat are not implemented: they require shared storage/presence and moderation. No visitor numbers are simulated.

Production builds fall back to the confirmed public address `https://jhester-portfolio.vercel.app/` if Vercel does not provide its production URL. Preview and local builds remain excluded from indexing. In Google Search Console add that exact HTTPS URL as a URL-prefix property, verify ownership, submit `sitemap.xml`, and request homepage indexing. If using HTML verification, save the token as `GOOGLE_SITE_VERIFICATION` in Vercel and redeploy first.

The sound-effects button now plays a short synthesized ringtone when enabled; disabling it mutes playback. Chat connection failures show recovery guidance and preserve the question for retry. Live Server on port 5500 now uses the same port 4173 server started by `npm run dev`.
