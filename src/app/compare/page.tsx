"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlatComparison, PERSON_LABEL, Person } from "@/lib/types";

type ApiResponse =
  | { ready: false; missing: Person[] }
  | { ready: true; comparisons: FlatComparison[] };

export default function ComparePage() {
  const [data, setData] = useState<ApiResponse | null>(null);

  useEffect(() => {
    fetch("/api/compare")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <main>
      <h1>Comparison</h1>
      <p className="lede">
        Side by side, so the conversation is about which tradeoff you&apos;ll
        accept — not whether a place even qualifies.
      </p>

      {!data ? (
        <p>Loading…</p>
      ) : !data.ready ? (
        <div className="banner warn">
          Still waiting on: {data.missing.map((p) => PERSON_LABEL[p]).join(", ")}.
          Constraints stay private until everyone&apos;s in.
        </div>
      ) : data.comparisons.length === 0 ? (
        <div className="card">
          <p className="hint">No flats entered yet.</p>
          <Link href="/flats">Add a flat →</Link>
        </div>
      ) : (
        data.comparisons.map((c) => (
          <div className="card compare-flat" key={c.flat.id}>
            <h2>{c.flat.name}</h2>
            <div className="flat-meta">
              {c.flat.area} · ₹{c.flat.rent.toLocaleString("en-IN")}/mo total (₹
              {Math.round(c.flat.rent / 3).toLocaleString("en-IN")} each) · floor{" "}
              {c.flat.floor} · {c.flat.hasLift ? "lift" : "no lift"} · {c.flat.bathrooms} bath
            </div>

            <p className="narrative">
              {c.narrative}
              {c.narrativeSource === "heuristic" && (
                <span className="small-note"> (heuristic summary — no OPENAI_API_KEY set)</span>
              )}
            </p>

            <div className="person-cols">
              {c.perPerson.map((p) => {
                const hasDealbreaker = p.dealbreakers.length > 0;
                const hasCompromise = p.softResults.some((s) => s.status !== "met");
                return (
                  <div
                    className={`person-col${hasDealbreaker ? " has-dealbreaker" : ""}`}
                    key={p.person}
                  >
                    <h3>
                      {PERSON_LABEL[p.person]}
                      {hasDealbreaker ? (
                        <span className="badge dealbreaker">✕ Dealbreaker</span>
                      ) : hasCompromise ? (
                        <span className="badge compromise">⚠ Compromise</span>
                      ) : (
                        <span className="badge clean">✓ Works</span>
                      )}
                    </h3>
                    <div className="flat-meta">
                      Her share: ₹{p.rentShare.toLocaleString("en-IN")}
                      {p.overBudget && " (over budget)"}
                    </div>
                    {p.dealbreakers.length > 0 && (
                      <ul>
                        {p.dealbreakers.map((d) => (
                          <li key={d.code}>
                            <span className="symbol dealbreaker">✕</span> {d.detail}
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.softResults.length > 0 && (
                      <ul>
                        {p.softResults.map((s) => (
                          <li key={s.preference}>
                            <span
                              className={`symbol ${
                                s.status === "met"
                                  ? "works"
                                  : s.status === "compromise"
                                  ? "compromise"
                                  : "compromise"
                              }`}
                            >
                              {s.status === "met" ? "✓" : s.status === "compromise" ? "⚠" : "?"}
                            </span>{" "}
                            {s.preference}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <Link href="/">← back to home</Link>
    </main>
  );
}
