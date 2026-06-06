import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  devIndicators: false,
  outputFileTracingExcludes: {
    "/*": [
      "./protected-content/smart-manufacturing/source_pages/**/*",
      "./protected-content/smart-manufacturing/source_pages_full/**/*",
      "./protected-content/smart-manufacturing/source_pages_cn/**/*",
      "./protected-content/smart-manufacturing/source_text/**/*",
    ],
  },
  outputFileTracingIncludes: {
    "/api/course/html": ["./protected-content/smart-manufacturing/smart_manufacturing_interactive_guide.html"],
  },
};

export default nextConfig;
