# Apple sign-up and sign-in on the website

The login page offers **Continue with Apple** in both sign-in and sign-up modes.
Apple's official JavaScript SDK opens a popup, then Supabase validates the returned
Apple ID token with a fresh nonce. First use creates an account; later uses sign
in to the same Apple identity. Sessions use the existing website auth client and
storage. No Apple private key or OAuth client secret is needed for this JS flow.

## Deployment configuration

Configured in Apple Developer team `M6SSG7664H` on October 26, 2026:

- Description: Talasofilia Website
- Identifier: `com.talasofiliapilates.web`
- Sign in with Apple primary App ID: `com.talasofiliapilates.app`
- Domains: `www.talasofiliapilates.com`, `talasofiliapilates.com`
- Return URLs: `https://www.talasofiliapilates.com/login`,
  `https://talasofiliapilates.com/login`

Supabase project `ozbmigymgrkheoiooiln` has Apple enabled with Client IDs
`com.talasofiliapilates.web,com.talasofiliapilates.app`. Manual linking remains enabled. Both clients must use
the same primary Apple app group so Apple's subject identifies the same person
on the phone and website. New preview domains need separate Apple registration;
localhost cannot complete Apple's web authorization.

The configuration above was saved. The website code still needs deployment. Apple web
OAuth (`signInWithOAuth`) remains separate and would require its own OAuth secret;
this implementation uses `signInWithIdToken` with the Apple JS popup instead.

## Existing members

Members who registered with email/password should connect Apple in the iPhone
app's **My profile → Connected accounts** before using Apple on the website,
especially with Hide My Email. A relay address can otherwise create a separate
account. Linking does not merge two accounts that already exist.

## Verification

- `npm test`: token exchange, nonce hashing, fresh state, rejected state/token,
  cancellation, provider failure, missing session, safe local destination, and
  existing dashboard/policy regression checks.
- `npm run build`: production compilation.
- Browser: Apple button is available in sign-in and sign-up modes independently
  of email form validation; loading/failure states preserve password sign-in.
- Production: verify Apple's popup accepts the Services ID and return URL, then
  complete consent with a test user. Check the user's ID, booking history, and
  credits match across the phone and website. Verify a new Apple member can
  register and later sign in. Authentication consent requires the account owner.
