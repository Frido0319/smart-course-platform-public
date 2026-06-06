# Deployment

## Hosting

The app is designed for Vercel plus Supabase:

- Vercel hosts the Next.js application.
- Supabase stores activation codes, access logs, course metadata, and private media.

This public repository does not include private course media or real environment values.

## Required Environment Variables

Set these in `.env.local` for local development and in Vercel project settings for deployment:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.example
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
ADMIN_PASSWORD=
```

Never commit real secret values to Git.

## Supabase Requirements

Run:

```text
supabase/schema.sql
```

The app expects:

- `courses`
- `course_versions`
- `course_resources`
- `activation_codes`
- `access_logs`
- a private Storage bucket named `smart-course-assets`

## Course Asset Upload

Private media folders are ignored by Git:

```text
protected-content/smart-manufacturing/source_pages/
protected-content/smart-manufacturing/source_pages_full/
protected-content/smart-manufacturing/source_pages_cn/
```

Upload them after setting `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`:

```bash
npm run upload:smart-assets
```

## Build Verification

Before deploying:

```bash
npm run test:course
npm run lint
npm run build
```

## Smoke Test

After deployment:

1. Open the student entry page.
2. Confirm the admin page is reachable only by direct URL and password.
3. Generate a test activation code.
4. Activate the code from the student entry page.
5. Confirm `/course/smart-manufacturing` loads.
6. Confirm unauthenticated direct calls to `/api/course/html` and `/api/course/asset/...` return `401`.
7. Delete the test activation code.
