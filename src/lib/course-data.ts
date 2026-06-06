import type { CourseManifest } from "./types";

export const smartManufacturingManifest: CourseManifest = {
  course: {
    id: "smart-manufacturing",
    title: "Smart Manufacturing Foundations",
    subtitle: "Protected bilingual course shell with activation-code access control.",
  },
  sections: [
    {
      id: "platform",
      title: "Access-Controlled Course Platform",
      description:
        "A Next.js and Supabase application that protects course HTML and media behind activation-code and device checks.",
      items: [
        {
          title: "Activation flow",
          detail: "Students enter a code, the server validates it, and the first successful use binds it to the current device.",
          badge: "Implemented",
        },
        {
          title: "Device binding",
          detail: "Protected course routes re-check the session, activation status, course id, device id, and expiration.",
          badge: "Implemented",
        },
        {
          title: "Admin console",
          detail: "Admins can generate, inspect, reset, disable, and delete activation codes.",
          badge: "Implemented",
        },
      ],
    },
    {
      id: "course-shell",
      title: "Example Protected Course",
      description:
        "This public repository ships only a small demo course shell. Private paid course images and full source datasets are intentionally excluded.",
      items: [
        {
          title: "Protected HTML",
          detail: "The course iframe loads from /api/course/html only after authorization succeeds.",
        },
        {
          title: "Protected media path",
          detail: "Relative course assets under source_pages, source_pages_full, and source_pages_cn are rewritten to /api/course/asset/...",
        },
        {
          title: "Storage split",
          detail: "Large course images can be uploaded to a private Supabase Storage bucket instead of being committed to Git.",
        },
      ],
    },
  ],
};
