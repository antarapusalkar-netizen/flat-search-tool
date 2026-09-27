"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flat } from "@/lib/types";
import { PropertyListingCandidate } from "@/lib/properties/types";

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

  const [searchCity, setSearchCity] = useState("Pune");
  const [searchLocality, setSearchLocality] = useState("");
  const [searchBhk, setSearchBhk] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchLive, setSearchLive] = useState<boolean | null>(null);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [candidates, setCandidates] = useState<PropertyListingCandidate[]>([]);

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

  const search = async () => {
    setSearching(true);
    setSearchError("");
    setHasSearched(false);
    setCandidates([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: searchCity,
          locality: searchLocality,
          bhk: searchBhk ? Number(searchBhk) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Search failed");
        return;
      }
      setSearchLive(Boolean(data.live));
      setCandidates(data.candidates ?? []);
      setHasSearched(true);
    } catch {
      setSearchError("Search failed — check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  const useCandidate = (c: PropertyListingCandidate) => {
    setName(c.title);
    setAddress(c.address);
    setArea(c.area);
    if (c.rent !== null) setRent(String(c.rent));
    if (c.floor !== null) setFloor(String(c.floor));
    if (c.hasLift !== null) setHasLift(c.hasLift);
    if (c.hasParking !== null) setHasParking(c.hasParking);
    if (c.bathrooms !== null) setBathrooms(String(c.bathrooms));
    setPetFriendly(false);
    setNotes(c.notes);
    document.getElementById("add-flat-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main>
      <h1>Candidate flats</h1>
      <p className="lede">
        Search NoBroker for listings, or paste in details of a flat one of you found by
        hand. Either way, you confirm every field before it's added — nothing gets checked
        against anyone's constraints until you do.
      </p>

      <div className="card">
        <h2>Search NoBroker</h2>
        {searchLive === false && (
          <p className="hint">
            No RAPIDAPI_KEY configured — showing a few sample Pune listings so the flow
            still works in dev.
          </p>
        )}
        <label>City</label>
        <input value={searchCity} onChange={(e) => setSearchCity(e.target.value)} />
        <label>Locality (optional)</label>
        <input
          value={searchLocality}
          onChange={(e) => setSearchLocality(e.target.value)}
          placeholder="e.g. Baner"
        />
        <label>Bedrooms / BHK (optional)</label>
        <input
          type="number"
          min={1}
          value={searchBhk}
          onChange={(e) => setSearchBhk(e.target.value)}
        />
        <button className="primary" disabled={searching || !searchCity} onClick={search}>
          {searching ? "Searching…" : "Search"}
        </button>
        {searchError && <p className="hint">{searchError}</p>}
        {hasSearched && !searchError && candidates.length === 0 && (
          <p className="hint">
            No listings came back for that search
            {searchLive ? " — NoBroker's scraper is a bit unreliable, worth trying again" : ""}.
            You can always add a flat by hand below.
          </p>
        )}

        {candidates.length > 0 && (
          <div className="flat-list">
            {candidates.map((c) => (
              <div className="flat-row" key={c.sourceId}>
                <div>
                  <strong>{c.title}</strong>
                  <div className="flat-meta">
                    {c.area || "area unknown"} ·{" "}
                    {c.rent !== null
                      ? `₹${c.rent.toLocaleString("en-IN")}/mo${c.rentIsEstimate ? " (estimate)" : ""}`
                      : "rent unknown"}{" "}
                    · {c.bathrooms ?? "?"} bath
                  </div>
                  {c.sourceUrl && (
                    <a href={c.sourceUrl} target="_blank" rel="noreferrer">
                      view source listing
                    </a>
                  )}
                </div>
                <button className="secondary" onClick={() => useCandidate(c)}>
                  Use this
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" id="add-flat-form">
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
