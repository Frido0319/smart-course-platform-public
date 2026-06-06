import Link from "next/link";

export default function Home() {
  return (
    <main className="shell landing-shell">
      <section className="topbar landing-topbar">
        <div>
          <p className="eyebrow">Smart Course Platform</p>
          <h1>Activation-protected course delivery</h1>
          <p className="muted">
            A Next.js and Supabase reference app for selling interactive course access with activation codes,
            single-device binding, protected HTML, and private media delivery.
          </p>
        </div>
      </section>

      <section className="panel hero-panel product-hero">
        <div>
          <h2>Activation codes plus device binding</h2>
          <p>
            Students enter a code, the server validates it, and the first successful activation binds that code to the
            current browser device. Later access is checked server-side before course HTML or media is served.
          </p>
        </div>
        <Link className="button primary" href="/activate">
          Enter activation code
        </Link>
      </section>

      <section className="grid two">
        <article className="panel">
          <h3>Protected course shell</h3>
          <p className="muted">
            The public repository includes a compact demo course. Private paid course images and extracted datasets are
            intentionally excluded from Git.
          </p>
        </article>
        <article className="panel">
          <h3>Admin operations</h3>
          <p className="muted">
            Admins can generate activation codes, inspect bound devices, reset a binding, disable access, or delete a code.
          </p>
        </article>
      </section>
    </main>
  );
}
