export type CourseSummary = {
  id: string;
  title: string;
  subtitle: string;
};

export type SessionPayload = {
  activationCodeId: string;
  courseId: string;
  deviceId: string;
  role: "student" | "admin";
};

export type ActivationCodeRow = {
  id: string;
  label: string;
  course_id: string;
  status: "unused" | "active" | "disabled" | "expired";
  bound_device_id: string | null;
  activated_at: string | null;
  expires_at: string | null;
  reset_count: number;
  max_resets: number;
  last_seen_at: string | null;
  created_at: string;
};

export type CourseManifest = {
  course: CourseSummary;
  sections: Array<{
    id: string;
    title: string;
    description: string;
    items: Array<{
      title: string;
      detail: string;
      badge?: string;
    }>;
  }>;
};
