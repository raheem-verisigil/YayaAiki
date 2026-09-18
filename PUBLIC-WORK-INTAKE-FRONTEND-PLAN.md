# Public Work Intake Frontend Implementation Plan

**Goal:** Let an unauthenticated Nigerian business submit a real repeatable-work requirement, receive an intake ID, and track safe status without a meeting.  
**Current state:** `Home.tsx` sends visitors to WhatsApp and `Workspace.tsx` saves a local demo brief with a toast. No public intake route or persistence exists yet.

## 1. Add the route and data boundary

Create a public route in `client/src/App.tsx`:

- `/start-work` → `StartWork`
- `/intake/:publicId` → `IntakeStatus`

Keep `/` as the marketing page. Change the primary homepage and announcement CTAs from the WhatsApp-only action to `/start-work`. Keep WhatsApp as the secondary “Need help?” route and include a prefilled link carrying the intake URL after submission where practical.

Add a small typed client wrapper in `client/src/lib/intake.ts` or use the existing tRPC client consistently. Do not call the database from the browser. The browser calls a public server procedure such as `publicIntake.create` and receives only `intakePublicId`, a signed status token, and safe status fields.

## 2. Define the form state

Use React Hook Form with Zod validation. Keep the first form short enough for mobile completion, but capture the information required to qualify the work.

```ts
type WorkIntakeValues = {
  jobFamily: string;
  taskDescription: string;
  expectedOutput: string;
  quantity: string;
  deadline?: string;
  requiredSkills?: string;
  acceptanceCriteria: string;
  evidenceRequired?: string;
  dataClass: "D0" | "D1" | "D2" | "D3" | "D4" | "D5";
  countryCode: "NG";
  preferredLanguage?: string;
  budgetRange?: "UNDER_100K" | "100K_500K" | "500K_1M" | "OVER_1M" | "NOT_SURE";
  contactName: string;
  organizationName: string;
  email: string;
  phoneE164: string;
  consent: boolean;
};
```

Do not collect identity documents, payment details, passwords, or private evidence in this public form. If the buyer needs to share sensitive samples, operations should send an authenticated upload link after qualification.

## 3. Build the page in progressive steps

Use a four-step form with a visible progress indicator and a mobile-first layout.

### Step 1: Choose the work family

Display cards or a select list:

- Data operations
- AI evaluation
- Transcription
- Translation
- Research support
- Quality assurance
- Catalogue/product data
- Document processing
- Other repeatable work

When “Other” is selected, require a clear description. Do not present a giant architecture explanation before the visitor can act.

### Step 2: Describe the outcome

Fields:

- What needs to be done?
- What should be delivered?
- How many units or batches?
- When is it needed?
- What skills or language are required?

Use examples and helper text. Do not overpromise a quote or capacity.

### Step 3: Define proof and risk

Fields:

- What makes the result acceptable?
- What evidence should be produced?
- How sensitive is the data?
- Where will the work be performed and processed?
- What budget range is available?

Explain that the request will be reviewed before a price and capacity commitment is issued. Mark data classes clearly and route D3–D5 requests to operations review.

### Step 4: Contact and review

Collect name, organization, work email, Nigerian phone number, preferred language, and consent. Show a complete review summary before submission. Allow edits without losing prior answers.

The consent text should state that YayaAiki may use the submitted information to evaluate and respond to the work request, subject to the privacy notice. Do not bundle marketing consent into required service consent.

## 4. Submit behavior

On submit:

1. Disable the submit button and show progress.
2. Send `publicIntake.create` with an attribution object from URL parameters and referrer.
3. Handle validation errors inline.
4. Handle rate-limit, bot, network, and server errors without losing form data.
5. On success, store the signed status token only in session storage or the URL fragment; do not place sensitive intake content in the URL.
6. Navigate to `/intake/:publicId`.
7. Show the public intake ID, for example `INT-NG-000001`, the received time, current safe status, and the next expected action.

Recommended success copy:

> **Your work request has been received.**
>
> Intake ID: `INT-NG-000001`  
> We will review the requirement and either ask for clarification or prepare a structured Work Order and quote. No capacity, price, verification, or payment is confirmed yet.

## 5. Status page behavior

`IntakeStatus` calls `publicIntake.getStatus` with the signed token. Display only:

- intake ID;
- status: received, clarification needed, under review, quote ready, or converted;
- submitted date;
- work family;
- next action;
- safe contact/support path;
- optional clarification form.

Do not expose internal reviewer notes, worker identities, pricing assumptions, sensitive task data, or other customer records.

If status is `NEEDS_CLARIFICATION`, provide `publicIntake.requestClarification`. If status is `QUOTED`, require authenticated buyer confirmation or a signed quote link before conversion. If status is `CONVERTED`, show the authenticated workspace sign-in path rather than exposing the full Work Order publicly.

## 6. Attribution and analytics

Capture non-sensitive attribution fields:

- `utm_source`, `utm_medium`, `utm_campaign`;
- source channel;
- landing path;
- referrer;
- first-touch timestamp;
- intake-start and intake-submit events.

Never send task descriptions, contact details, data sensitivity, evidence, identity documents, payment details, or private work samples to analytics, session replay, or ad platforms. Redact form fields by default from session replay.

Minimum events:

- `work_intake_viewed`
- `work_intake_started`
- `work_intake_step_completed`
- `work_intake_submitted`
- `work_intake_failed`
- `work_intake_status_viewed`
- `work_intake_clarification_requested`
- `work_intake_converted`

## 7. Accessibility and mobile requirements

Use labels associated with every input, not placeholder-only fields. Provide keyboard access, visible focus, error summaries, `aria-live` status updates, and descriptive button text. Keep primary actions reachable on small Android-sized screens. Avoid multi-column forms on mobile. Preserve data when navigating between steps or after an error.

## 8. Security and abuse controls

The server must enforce the actual controls; the frontend only improves the experience.

- Add a honeypot or approved bot challenge.
- Rate-limit by IP and contact identifier.
- Normalize and validate email and E.164 phone values.
- Enforce maximum lengths and reject unknown fields server-side.
- Escape rendered user-provided text.
- Do not accept file uploads in the first public form.
- Add a privacy-policy link and separate marketing consent.
- Provide a safe error message that does not reveal whether an organization or contact already exists.

## 9. Tests before release

Add tests for:

- each step’s required validation;
- mobile-safe error rendering;
- successful submission and navigation;
- duplicate-click protection;
- server validation errors;
- rate-limit and network recovery;
- signed status-token handling;
- no sensitive data sent to analytics;
- D3–D5 requests showing a review expectation;
- `NEEDS_CLARIFICATION` and `CONVERTED` status paths;
- accessibility labels and keyboard progression.

Run `pnpm check`, `pnpm test`, and `pnpm build`. Then manually test from a WhatsApp or social link on a narrow viewport and verify the full path from landing page to intake ID without a meeting.
