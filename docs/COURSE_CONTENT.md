# Course Content

## Public Repository Scope

This repository ships a small demo course shell so reviewers can understand how protected course delivery works without receiving private paid course assets.

Included:

```text
protected-content/smart-manufacturing/smart_manufacturing_interactive_guide.html
```

Excluded from Git:

```text
protected-content/smart-manufacturing/source_pages/
protected-content/smart-manufacturing/source_pages_full/
protected-content/smart-manufacturing/source_pages_cn/
protected-content/smart-manufacturing/source_text/
```

The excluded folders can contain rendered PDF/PPT pages, localized page images, extracted OCR text, question datasets, and other private paid course material.

## Protected Delivery Flow

The app renders the course inside an iframe after authorization:

```text
/course/smart-manufacturing
```

The iframe source is protected:

```text
/api/course/html
```

Course asset paths are also protected:

```text
/api/course/asset/[...assetPath]
```

## HTML Path Rewriting

`src/lib/course-content-utils.mjs` rewrites relative course media links:

```text
source_pages/...       -> /api/course/asset/source_pages/...
source_pages_full/...  -> /api/course/asset/source_pages_full/...
source_pages_cn/...    -> /api/course/asset/source_pages_cn/...
```

This keeps exported HTML portable while making media access go through the same server-side session and device checks.

## Private Media Storage

Large course media should be uploaded to a private Supabase Storage bucket:

```text
smart-course-assets
```

Upload command:

```bash
npm run upload:smart-assets
```

The upload script maps non-ASCII filenames into storage-safe keys while preserving the original browser-facing paths in course HTML.

## Verification Checklist

Run:

```bash
npm run test:course
npm run lint
npm run build
```

Manual checks:

- `/api/course/html` returns `401` when unauthenticated.
- `/api/course/asset/...` returns `401` when unauthenticated.
- Activated users can load the course iframe.
- Activated users can load protected assets through the API route.
