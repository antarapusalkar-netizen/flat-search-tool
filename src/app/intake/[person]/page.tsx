"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Constraints } from "@/lib/types";

const LABELS: Record<string, string> = { riya: "Riya", meera: "Meera", kavita: "Kavita" };

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setDraft("");
  };
  return (
    <div>
      <div className="inline-add">
        <input
          type="text"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className="secondary" onClick={add}>
          Add
        </button>
      </div>
      <div className="tag-row">
        {values.map((v) => (
          <span key={v} className="tag">
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))}>
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function IntakePage({
  params,
}: {
  params: Promise<{ person: string }>;
}) {
  const { person } = usePromise(params);
  const router = useRouter();

  const [loaded, setLoaded] = useState(false);
  const [maxRent, setMaxRent] = useState("");
  const [noGoAreas, setNoGoAreas] = useState<string[]>([]);
  const [lift, setLift] = useState(false);
  const [parking, setParking] = useState(false);
  const [minBathrooms, setMinBathrooms] = useState("1");
  const [petFriendly, setPetFriendly] = useState(false);
  const [softPreferences, setSoftPreferences] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const validPerson = ["riya", "meera", "kavita"].includes(person);

  useEffect(() => {
    if (!validPerson) return;
    fetch(`/api/constraints/${person}`)
      .then((r) => r.json())
      .then((data: { constraints: Constraints | null }) => {
        if (data.constraints) {
          const c = data.constraints;
          setMaxRent(String(c.maxRent));
          setNoGoAreas(c.noGoAreas);
          setLift(c.hardRequirements.lift);
          setParking(c.hardRequirements.parking);
          setMinBathrooms(String(c.hardRequirements.minBathrooms));
          setPetFriendly(c.hardRequirements.petFriendly);
          setSoftPreferences(c.softPreferences);
        }
        setLoaded(true);
      });
  }, [person, validPerson]);

  if (!validPerson) {
    return (
      <main>
        <p>Unknown person.</p>
        <Link href="/">← back</Link>
      </main>
    );
  }

  const submit = async () => {
    await fetch(`/api/constraints/${person}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maxRent: Number(maxRent),
        noGoAreas,
        hardRequirements: {
          lift,
          parking,
          minBathrooms: Number(minBathrooms),
          petFriendly,
        },
        softPreferences,
      }),
    });
    setSaved(true);
    setTimeout(() => router.push("/"), 900);
  };

  return (
    <main>
      <h1>{LABELS[person]}&apos;s constraints</h1>
      <p className="lede">
        Private to you until everyone has submitted. Be honest about dealbreakers —
        that&apos;s the entire point.
      </p>

      {!loaded ? (
        <p>Loading…</p>
      ) : (
        <div className="card">
          <label>Max rent contribution (₹/month, your share)</label>
          <input
            type="number"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
            placeholder="e.g. 18000"
          />

          <label>
            No-go areas
            <div className="hint">Anywhere you won&apos;t live, no matter what</div>
          </label>
          <TagInput values={noGoAreas} onChange={setNoGoAreas} placeholder="e.g. Hinjewadi" />

          <label style={{ marginTop: 22 }}>Hard requirements (dealbreakers)</label>
          <label className="checkbox">
            <input type="checkbox" checked={lift} onChange={(e) => setLift(e.target.checked)} />
            Lift required
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={parking}
              onChange={(e) => setParking(e.target.checked)}
            />
            Parking required
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={petFriendly}
              onChange={(e) => setPetFriendly(e.target.checked)}
            />
            Must be pet-friendly
          </label>
          <label>Minimum bathrooms</label>
          <input
            type="number"
            min={1}
            value={minBathrooms}
            onChange={(e) => setMinBathrooms(e.target.value)}
          />

          <label>
            Soft preferences
            <div className="hint">Nice-to-haves you could live without</div>
          </label>
          <TagInput
            values={softPreferences}
            onChange={setSoftPreferences}
            placeholder="e.g. balcony, close to metro"
          />

          <button
            className="primary"
            disabled={!maxRent || Number(maxRent) <= 0}
            onClick={submit}
          >
            {saved ? "Saved ✓" : "Save my constraints"}
          </button>
        </div>
      )}

      <Link href="/">← back to home</Link>
    </main>
  );
}
