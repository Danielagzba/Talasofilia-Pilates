Run `npm ci --ignore-scripts` and `npm test` using Node 22.15+ (verified with Node 26).

The regression suite starts a local HTTP fixture and exercises the real Next route handlers and Supabase SDK. It does not contact the deployed studio database or require real credentials. It checks bearer-token propagation through database queries, concurrent account isolation, authentication rejection, database-error handling, and the public cancellation setting's numeric/string/zero/missing/invalid cases.

For deployment QA, sign in with an existing credited member and compare Dashboard with Book a Class, then visit Classes and Pricing signed out. Both FAQs should show the configured cancellation deadline. The new public route reads only `cancellation_window_hours` using the server's existing `SUPABASE_SERVICE_ROLE_KEY`; no new database migration is needed. If the policy cannot be loaded, the FAQ directs visitors to their account or the studio instead of inventing a deadline.
