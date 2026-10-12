# US Executive Travel — permanent website plan

## Product
A premium, responsive executive transportation website with a conversion-focused booking flow, service/fleet storytelling, and a production-ready API for booking requests.

## Design system
- **Movement:** quiet luxury editorial travel interface.
- **Principles:** calm hierarchy, high-trust details, precise form flow, and restrained motion.
- **Palette:** deep navy communicates confidence; warm paper keeps long-form content approachable; lime is the ownable action color for booking moments.
- **Layout:** asymmetrical editorial sections with a booking panel anchored beside the hero rather than a generic centered marketing grid.
- **Signature elements:** US monogram mark, lime status/CTA accents, route-line booking controls, and oversized serif italic emphasis.
- **Interaction:** progressive disclosure in the booking wizard; clear loading, validation, error, and success states.
- **Animation:** GSAP entrance choreography with `prefers-reduced-motion` support; hover movement stays subtle and functional.
- **Typography:** Geist Variable for interface precision with Georgia serif emphasis for warmth and arrival-focused headlines.
- **Brand essence:** the considered way to travel for people who value time, calm, and dependable service. Personality: discreet, precise, assured.
- **Voice:** concise, composed, human. Example lines: “Arrive remarkably.” and “Good travel is felt before you arrive.”
- **Wordmark:** compact US monogram in a lime rounded tile paired with the US Executive name lockup.
- **Signature color:** lime `#d5f249`.

## Implementation
- Vite + React frontend with React Router routes.
- Three-step booking wizard with UK address suggestions, one-way/return support, vehicle selection, customer details, review, indicative fare, and API submission.
- Express backend for analytics, booking, contact, driver application, and existing auth/dashboard endpoints.
- Static build output in `dist/`; containerized API server in `server/`.
- Managed publication routes `/api/*` and `/health` to the server, with SPA fallback for frontend paths.
- Durable logo metadata uses managed project storage.
