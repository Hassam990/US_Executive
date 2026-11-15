# US Executive Travel SEO report

**Review date:** 2026-11-15  
**Review type:** Repository review plus supplied AIOSEO scan and attempted Jev audit  
**Production URL:** https://us-executivetravel.com/  
**Code commit:** `380325f` (`Improve site SEO metadata and crawl files`)

## Executive summary

The repository contained conflicting location and business information. The homepage described a US concierge/travel agency while the service pages describe a Surrey-based private hire chauffeur service serving London and UK destinations. The sitemap used an underscore hostname and listed only the homepage. Those repository issues have been corrected and pushed to `origin/main`.

The supplied AIOSEO report, generated on 2026-11-15 for `https://www.us-executivetravel.com`, gives the homepage a score of **78/100**, with 4 critical issues, 2 recommendations, and 15 good results. It confirms the canonical host is the non-`www` URL and says both host variants redirect to the same site. The Jev crawler attempt from this environment still refused the production hostname because local DNS did not resolve it, so Jev-specific judgments and PageSpeed data remain unavailable here.

## Work completed

- Added route-aware titles, descriptions, canonical links, Open Graph tags, Twitter tags, and robots directives for the React routes.
- Shortened the homepage title from 71 characters to 57 after the AIOSEO report flagged its length.
- Replaced the incorrect TravelAgency/United States structured data with LocalBusiness information for Surrey, London, and the United Kingdom. Removed the incorrect self-referential `sameAs` value.
- Corrected the hostname and expanded the sitemap to include the homepage, services, fleet, drivers, contact, booking, and driver application pages.
- Added robots exclusions for admin and account routes.
- Updated `llms.txt` to match the service area, contact details, and public page URLs.

## Verification

- `npm run build`: passed. Existing build warnings remain for unsupported CSS at-rules during minification and a large booking-page bundle.
- JSON-LD block: parses as JSON.
- `public/sitemap.xml`: parses as XML.
- AIOSEO external scan: homepage score 78/100; meta description is 147 characters; canonical and robots directives are present; Open Graph tags and Schema.org data are detected.
- AIOSEO reports no H1, H2, or internal links in its scanned HTML. The Vite React app renders its page headings and links client-side, so crawlers that do not render JavaScript may not see them. Static route prerendering is the recommended follow-up.
- AIOSEO flags directory listing as possibly enabled. This needs a direct request to the relevant directory before treating it as confirmed; Vercel SPA fallback behavior can confuse directory-listing heuristics.
- AIOSEO flags a JavaScript bundle as not minified. The local Vite production build minifies bundles, so this appears to be a heuristic false positive, but the live asset was not fetched here to verify.
- Jev live crawl: blocked before crawling because local DNS did not resolve the host to a public address. No Jev judgments or PageSpeed/Core Web Vitals measurements were produced.
- Direct homepage, robots, and sitemap checks from this environment were unavailable. The provided AIOSEO report does confirm canonical and robots data from its external scan.

## Follow-up from the supplied 83/100 overview

The follow-up scan reports 22/28 passed, 1 warning, and 5 failed tests. It accepts the 57-character title and the 115-character description that was current when it ran. The description has since been revised to 114 characters to include the primary local-intent phrase. It still reports no H1/H2, image ALT, or internal links because the original HTML response contained only an empty React root. The homepage now ships a concise, styled HTML fallback with one H1, section H2s, an alt-described brand image, and internal links. React replaces this fallback when the app starts. The copy is useful to visitors without JavaScript and is not hidden keyword text.

Other overview signals need separate verification: the mobile warning conflicts with the existing viewport and responsive CSS, and INP/DOM metrics were unavailable or not measured against field data here. No social URLs were supplied, so no profiles were invented. The 500-word recommendation is a generic tool heuristic; no filler was added to reach that threshold. Re-run the scanner against the deployed build to verify the static HTML change.

## Keyword targeting

Qualitative search-result review suggests these relevant, local-intent phrases: **Surrey chauffeur service** (primary), **Surrey airport transfers**, **Heathrow airport transfers from Surrey**, **Gatwick airport transfers from Surrey**, and **corporate chauffeur service**. Search results from [Hadley’s Surrey chauffeur page](https://hadley.london/locations/surrey/) and [Drive Chauffeur’s Surrey service page](https://drivechauffeur.co.uk/) use overlapping local service language. This is not search-volume or difficulty research; no volume numbers are claimed.

The primary and supporting phrases are now used naturally across the homepage, airport-transfer copy, services page, and fleet introduction. No obsolete `meta keywords` tag was added. Future keyword prioritization should use Search Console query data or an approved keyword-data provider.

## Prioritized follow-up

| Priority | Action | Evidence / reason | Status |
|---|---|---|---|
| P1 | Prerender public routes with their H1, H2, and internal links in initial HTML. | The homepage now has an HTML fallback; other routes still rely on client rendering. | Partially implemented |
| P1 | Verify the AIOSEO directory-listing warning against the flagged directory URL. | The PDF does not identify the exact directory path; the result may be a SPA fallback heuristic. | Needs the flagged URL / live verification |
| P2 | Re-run AIOSEO after deployment to confirm the new 57-character title is live. | The attached scan captured the prior 71-character title. | Pending deployment and external recrawl |
| P2 | Rerun Jev against the `www` URL after local DNS/network access is available. | The supplied report shows the `www` host is the entry URL, but Jev's public-address guard could not resolve it in this environment. | Blocked on local reachability |
| P2 | Replace the square logo used as the social preview with a dedicated 1200×630 image. | Current `og:image` and `twitter:image` point to `/logo.png`; its social-card suitability was not verified. | Not implemented |
| P3 | Run an optional keyword and competitor study only if wanted. | The linked skill's DataForSEO full mode is paid and was not run. | Not run |

## Limits

This report combines code review with the supplied AIOSEO homepage scan; it is not a full Jev report. The AIOSEO score is a tool score, not a ranking or traffic prediction. The supplied scan confirms the non-`www` canonical and redirect consistency. No search ranking or traffic improvement is promised. Jev judgments and live PageSpeed data should be added after the production site is reachable from the local audit environment.
