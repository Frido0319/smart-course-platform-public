import Link from "next/link";

import { AdminClient } from "./AdminClient";

export default function AdminPage() {
  return (
    <main className="shell">
      <Link className="text-link" href="/">
        Back to student entry
      </Link>
      <section className="topbar">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Activation code admin</h1>
          <p className="muted">Generate codes, inspect device bindings, reset devices, disable access, or delete codes.</p>
        </div>
      </section>
      <AdminClient />
    </main>
  );
}
