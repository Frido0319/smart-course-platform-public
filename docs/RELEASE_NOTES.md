# Release Notes

## v1.0.0

Initial public template release.

### Included

- Next.js App Router application shell.
- Student activation-code flow.
- Single-device binding policy for active codes.
- Protected course HTML API.
- Protected course asset API path rewriting and authorization checks.
- Supabase schema for activation codes and access logs.
- Admin console for code generation, listing, disabling, deleting, and device-binding reset.
- Public demo course shell without private paid course assets.
- GitHub Pages static product demo.
- README screenshots and deployment documentation.

### Excluded

- Private paid course media.
- Extracted PDF page images.
- Full private course datasets.
- Production secrets and local `.env.local` values.
- One-off OCR, repair, and migration process files.

### Verification

- `npm run test:course`
- `npm run lint`
- `npm run build`
