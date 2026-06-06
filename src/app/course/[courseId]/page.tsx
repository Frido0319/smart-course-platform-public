import Link from "next/link";

import { CourseClient } from "./CourseClient";

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;

  return (
    <main className="shell course-shell">
      <Link className="text-link course-home-link" href="/">
        返回首页
      </Link>
      <CourseClient courseId={courseId} />
    </main>
  );
}
