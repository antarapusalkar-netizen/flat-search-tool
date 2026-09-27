import Link from "next/link";
import { getDb } from "@/lib/db";
import { PEOPLE, PERSON_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  const all = await getDb().getAllConstraints();

  return (
    <main>
      <h1>Flat Search</h1>
      <p className="lede">
        One form each, filled in privately. No listing gets discussed until every
        dealbreaker is already on the table.
      </p>

      <div className="card">
        <h2>1. Set your constraints privately</h2>
        <p className="hint" style={{ marginBottom: 14 }}>
          Each person fills her own — nobody sees anyone else&apos;s until the
          comparison view below.
        </p>
        <div className="person-grid">
          {PEOPLE.map((person) => {
            const done = Boolean(all[person]);
            return (
              <Link key={person} href={`/intake/${person}`} className="person-card">
                <h2>{PERSON_LABEL[person]}</h2>
                <span className={`status ${done ? "done" : "pending"}`}>
                  {done ? "Submitted" : "Not yet"}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>2. Add candidate flats</h2>
        <p className="hint" style={{ marginBottom: 14 }}>
          Search NoBroker for listings, or paste in details of a flat you found
          by hand. Either way, you confirm every field before it&apos;s added.
        </p>
        <Link href="/flats" className="nav">
          <span className="nav">
            <span style={{ textDecoration: "underline" }}>Manage flats →</span>
          </span>
        </Link>
      </div>

      <div className="card">
        <h2>3. Compare</h2>
        <p className="hint" style={{ marginBottom: 14 }}>
          Unlocks once all three constraints are in. Shows who gets everything,
          who&apos;s compromising, and on exactly what.
        </p>
        <Link href="/compare">Go to comparison →</Link>
      </div>
    </main>
  );
}
