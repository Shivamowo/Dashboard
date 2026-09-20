/** Pure display helpers — safe for client components (no data-layer imports). */

/** UG / PG / Doctoral, read from the programme name. null when it can't be told. */
export function programLevel(name: string | null | undefined): string | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/\s+/g, "");
  if (/ph\.?d|doctor/.test(n)) return "Doctoral";
  if (/^(m\.|m-|mba|mca|ma|msc|mcom|llm|mpharm|m\.?tech|mtech|integratedm)/.test(n) || /^m[a-z]/.test(n) && !/^(mass|maths)/.test(n))
    return /integrated/.test(n) ? "UG + PG" : "PG";
  if (/^(b\.|b-|bba|bca|ba|bsc|bcom|llb|bpharm|dpharm|btech|b\.?tech|integrated)/.test(n) || /^b[a-z]/.test(n)) return "UG";
  return null;
}

/** Laboratory / Classroom / Other, read from the room name. */
export function roomType(name: string | null | undefined): string {
  const n = (name ?? "").toLowerCase();
  if (/lab|workshop|studio/.test(n)) return "Laboratory";
  if (/class|lecture|hall|room|year|semester|sem\b/.test(n)) return "Classroom";
  return "Other";
}
