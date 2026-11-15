# US Executive Travel SEO report

**Review date:** 2026-11-15  
**Review type:** Repository review plus attempted live audit  
**Production URL:** https://us-executivetravel.com/  
**Code commit:** `380325f` (`Improve site SEO metadata and crawl files`)

## Executive summary

The repository contained conflicting location and business information. The homepage described a US concierge/travel agency while the service pages describe a Surrey-based private hire chauffeur service serving London and UK destinations. The sitemap used an underscore hostname and listed only the homepage. Those repository issues have been corrected and pushed to `origin/main`.

The live audit is **incomplete**. The Jev SEO crawler refused the production host because it did not resolve to a public address from this environment. Browser fetches for the production host and `us-executive.vercel.app` also failed. This is not a crawl score and does not establish that the site is globally offline. No live URLs, PageSpeed results, Core Web Vitals, rankings, traffic, or Jev judgments are reported here.

## Work completed

- Added route-aware titles, descriptions, canonical links, Open Graph tags, Twitter tags, and robots directives for the React routes.
- Replaced the incorrect TravelAgency/United States structured data with LocalBusiness information for Surrey, London, and the United Kingdom. Removed the incorrect self-referential `sameAs` value.
- Corrected the hostname and expanded the sitemap to include the homepage, services, fleet, drivers, contact, booking, and driver application pages.
- Added robots exclusions for admin and account routes.
- Updated `llms.txt` to match the service area, contact details, and public page URLs.

## Verification

- `npm run build`: passed. Existing build warnings remain for unsupported CSS at-rules during minification and a large booking-page bundle.
- JSON-LD block: parses as JSON.
- `public/sitemap.xml`: parses as XML.
- Jev live crawl: blocked before crawling because the host did not resolve to a public address from this environment.
- Public-site checks of the homepage, `robots.txt`, and sitemap: unavailable from the browser fetch tool.

## Prioritized follow-up

| Priority | Action | Evidence / reason | Status |
|---|---|---|---|
| P1 | Verify the production DNS records and Vercel domain assignment for `us-executivetravel.com`, then confirm the canonical host and HTTPS redirect. | DNS lookup returned no public address from this environment; Jev's public-network guard refused the host. | Needs operator verification |
| P1 | Rerun the Jev audit after the production hostname resolves. | No pages were crawled, so technical rules, content judgments, and field metrics are unavailable. | Blocked on reachability |
| P2 | Consider prerendering route metadata and primary page content. | The app is a Vite React SPA; route-specific metadata is set after the client bundle runs. Search engines that do not render the app may see only the homepage shell metadata. | Not implemented |
| P2 | Replace the square logo used as the social preview with a dedicated 1200×630 image. | Current `og:image` and `twitter:image` point to `/logo.png`; its social-card suitability was not verified. | Not implemented |
| P3 | Run an optional keyword and competitor study only if wanted. | The linked skill's DataForSEO full mode is paid and was not run. | Not run |

## Limits

This is a repository-level SEO correction and an incomplete live audit, not a Jev scorecard. No search ranking or traffic improvement is promised. DNS status, live redirect behavior, rendered page metadata, and PageSpeed data should be checked again once the production hostname is reachable.
