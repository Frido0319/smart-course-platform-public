import Link from "next/link";

import { ActivationForm } from "./ActivationForm";

export default function ActivatePage() {
  return (
    <main className="shell narrow">
      <Link className="text-link" href="/">
        Back to student entry
      </Link>
      <section className="topbar">
        <div>
          <p className="eyebrow">Activation</p>
          <h1>Enter activation code</h1>
          <p className="muted">
            On first use, the activation code is bound to the current browser device. A device can hold only one active
            course binding at a time.
          </p>
        </div>
      </section>
      <ActivationForm />
    </main>
  );
}
