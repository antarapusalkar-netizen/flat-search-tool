"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flat } from "@/lib/types";

export default function FlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [rent, setRent] = useState("");
  const [floor, setFloor] = useState("0");
  const [hasLift, setHasLift] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [bathrooms, setBathrooms] = useState("1");
  const [petFriendly, setPetFriendly] = useState(false);
  const [notes, setNotes] = useState("");

  const load = () =>
    fetch("/api/flats")
      .then((r) => r.json())
      .then((d: { flats: Flat[] }) => {
        setFlats(d.flats);
        setLoaded(true);
      });

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setName("");
    setAddress("");
    setArea("");
    setRent("");
    setFloor("0");
    setHasLift(false);
    setHasParking(false);
    setBathrooms("1");
    setPetFriendly(false);
    setNotes("");
  };

  const submit = async () => {
    await fetch("/api/flats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        area,
        rent: Number(rent),
        floor: Number(floor),
        hasLift,
        hasParking,
        bathrooms: Number(bathrooms),
        petFriendly,
        notes,
      }),
    });
    reset();
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/flats/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <main>
      <h1>Candidate flats</h1>
      <p className="lede">
        Paste in details of a flat one of you found. Nothing here is looked up
        automatically — you find the listing, this checks it.
      </p>

      <div className="card">
        <h2>Add a flat</h2>
        <label>Name / listing title</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 3BHK Baner" />
        <label>Address</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} />
        <label>Area / locality</label>
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="e.g. Baner — match exactly against no-go lists"
        />
        <label>Total monthly rent (₹, split three ways)</label>
        <input type="number" value={rent} onChange={(e) => setRent(e.target.value)} />
        <label>Floor</label>
        <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} />
        <label className="checkbox">
          <input type="checkbox" checked={hasLift} onChange={(e) => setHasLift(e.target.checked)} />
          Has a lift
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={hasParking}
            onChange={(e) => setHasParking(e.target.checked)}
          />
          Has parking
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={petFriendly}
            onChange={(e) => setPetFriendly(e.target.checked)}
          />
          Pet-friendly
        </label>
        <label>Bathrooms</label>
        <input type="number" min={1} value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
        <label>
          Notes / description
          <div className="hint">
            Paste the listing description — this is what gets checked against soft preferences
            (balcony, natural light, etc.)
          </div>
        </label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button
          className="primary"
          disabled={!name || !area || !rent}
          onClick={submit}
        >
          Add flat
        </button>
      </div>

      <div className="card">
        <h2>Entered so far</h2>
        {!loaded ? (
          <p>Loading…</p>
        ) : flats.length === 0 ? (
          <p className="hint">No flats yet.</p>
        ) : (
          <div className="flat-list">
            {flats.map((f) => (
              <div className="flat-row" key={f.id}>
                <div>
                  <strong>{f.name}</strong>
                  <div className="flat-meta">
                    {f.area} · ₹{f.rent.toLocaleString("en-IN")}/mo · floor {f.floor} ·{" "}
                    {f.hasLift ? "lift" : "no lift"} · {f.bathrooms} bath
                  </div>
                </div>
                <button className="secondary" onClick={() => remove(f.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/">← back to home</Link>
    </main>
  );
}
