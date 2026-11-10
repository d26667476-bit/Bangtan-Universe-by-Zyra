# BTS---Bangtan-Sonyeondan
A scalable, data-driven web platform designed to aggregate, track, and visualize 13 years of media achievements, real-time streaming analytics, and community-driven content moderation frameworks.

## Website update notifications

The dashboard has an optional notification bell. Each visitor must open **Updates** and enable notifications (and allow them in their browser); notifications are sent only to subscribed browsers. To send alerts after site updates are published, finish the Firebase setup below and add all listed GitHub Actions secrets. The deployment workflow deploys the site/backend and sends a notice for changed site sections. GitHub Pages alone hosts the website but does not send push notifications. The Firebase Cloud Messaging setup stores subscription tokens in Firestore, protected by App Check and default-deny Firestore rules.

## Opening and sharing the website

The site root opens the BTS Universe dashboard. The GitHub Pages deployment publishes the static site at `https://d26667476-bit.github.io/BTS---Bangtan-Sonyeondan/`. To enable it, open the repository's **Settings → Pages**, set **Build and deployment → Source** to **GitHub Actions**, and push changes to `main` (or run **Deploy website to GitHub Pages** from the Actions tab). After the workflow succeeds, share that URL; the Pages site is not live until then.

The site also has an existing Firebase Hosting workflow. If Firebase is configured, its URL is `https://<FIREBASE_PROJECT_ID>.web.app/`; that workflow requires the Firebase secrets below. GitHub Pages provides the public static site without those secrets, while Firebase is required for the optional notification backend.

The dashboard includes a sitemap, search metadata, and sharing previews. To request Google indexing, add the published site in [Google Search Console](https://search.google.com/search-console), verify ownership, and submit `https://d26667476-bit.github.io/BTS---Bangtan-Sonyeondan/sitemap.xml`. Search engines decide whether and where to show the site; no setup can guarantee a top result.

### One-time Firebase setup

1. Create a Firebase project and register a web app. Create a Firestore database, enable Cloud Messaging, create a Web Push certificate key pair, and configure App Check for the web app with reCAPTCHA v3. Allow the public website's HTTPS domain in the App Check configuration.
2. Copy the web app settings, App Check site key, and Web Push certificate key into `firebase-config.js`. These are client configuration values, not service-account credentials.
3. Generate a long random webhook secret. Set it as the `NOTIFICATION_WEBHOOK_SECRET` Firebase Functions secret with `firebase functions:secrets:set NOTIFICATION_WEBHOOK_SECRET --project YOUR_FIREBASE_PROJECT_ID`, then enter the same value as a GitHub Actions repository secret. Never commit or share this secret.
4. Add these GitHub Actions repository secrets:
   - `FIREBASE_PROJECT_ID`: the Firebase project ID.
   - `FIREBASE_SERVICE_ACCOUNT`: service-account JSON authorized to deploy Firebase Hosting, Cloud Functions, Firestore rules, and access the Functions secret.
   - `NOTIFICATION_WEBHOOK_SECRET`: the same secret configured in the previous step.
5. Push site changes to the `main` branch. The Firebase workflow deploys Hosting and Functions, then sends one notice listing the changed site sections. Visitors can opt in from the **Updates** bell on the dashboard.

Cloud Functions deployment may require the Firebase project's Blaze plan. Browser push requires a supported browser and a secure HTTPS origin (localhost is suitable for local development). Firebase setup is not complete until the project values and GitHub secrets are configured. Google Search indexing is separate from hosting and push notifications, and search placement cannot be guaranteed.
