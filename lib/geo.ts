// lightweight geo helpers for the checkout form — free, no-key APIs.
// states are cached per country; indian pincodes are validated/filled via
// api.postalpincode.in. failures fall back to a text input so the form never
// blocks on a third party.

export type GeoOption = { label: string; value: string };

const STATE_CACHE = new Map<string, string[]>();

const PHONE_CODES: GeoOption[] = [
  { label: "🇮🇳 +91", value: "+91" },
  { label: "🇺🇸 +1", value: "+1" },
  { label: "🇬🇧 +44", value: "+44" },
  { label: "🇦🇺 +61", value: "+61" },
  { label: "🇨🇦 +1", value: "+1" },
  { label: "🇩🇪 +49", value: "+49" },
  { label: "🇫🇷 +33", value: "+33" },
  { label: "🇯🇵 +81", value: "+81" },
  { label: "🇧🇷 +55", value: "+55" },
  { label: "🇦🇪 +971", value: "+971" },
  { label: "🇸🇬 +65", value: "+65" },
  { label: "🇸🇪 +46", value: "+46" },
  { label: "🇮🇳 +91 (IN)", value: "+91" },
];

export const PHONE_CODES_LIST = PHONE_CODES;

export function defaultPhoneCodeForCountry(country: string): string {
  const c = country.trim().toUpperCase();
  if (c === "INDIA" || c === "IN") return "+91";
  if (c === "UNITED STATES" || c === "US" || c === "UNITED STATES OF AMERICA") return "+1";
  if (c === "UNITED KINGDOM" || c === "GB") return "+44";
  if (c === "GERMANY" || c === "DE") return "+49";
  if (c === "FRANCE" || c === "FR") return "+33";
  if (c === "JAPAN" || c === "JP") return "+81";
  if (c === "BRAZIL" || c === "BR") return "+55";
  if (c === "AUSTRALIA" || c === "AU") return "+61";
  if (c === "CANADA" || c === "CA") return "+1";
  if (c === "UNITED ARAB EMIRATES" || c === "AE") return "+971";
  return "+1";
}

// free countriesnow API: states for a country name. returns a list of state
// names, or null when nothing is known (form falls back to free text).
export async function fetchStates(
  country: string | null | undefined
): Promise<string[] | null> {
  if (!country) return null;
  const key = country.toLowerCase();
  if (STATE_CACHE.has(key)) return STATE_CACHE.get(key)!;
  try {
    const res = await fetch("https://countriesnow.com/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country }),
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    });
    // countriesnow responds in two shapes; normalise both:
    //  { data: { states: [...] } }  or  { data: [ { states: [...] } ] }
    const json = (await res.json().catch(() => null)) as
      | { error?: boolean; data?: { states?: Array<{ state_id?: string; state?: string }> } | Array<{ states?: Array<{ state_id?: string; state?: string }> }> }
      | null;
    if (json?.error || !json?.data) return null;
    let statesArr: Array<{ state_id?: string; state?: string }> | undefined;
    if (Array.isArray(json.data)) {
      statesArr = json.data[0]?.states;
    } else {
      statesArr = json.data.states;
    }
    if (!statesArr) return null;
    const states = statesArr
      .map((s) => s.state ?? s.state_id ?? "")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!states.length) return null;
    STATE_CACHE.set(key, states);
    return states;
  } catch {
    return null;
  }
}

// india-only pincode lookup against the free postalpincode.in API. returns the
// district + state a pin maps to, or null if the pin isn't valid.
export async function verifyIndiaPin(
  pin: string
): Promise<{ district: string; state: string } | null> {
  if (!/^\d{6}$/.test(pin.trim())) return null;
  try {
    const res = await fetch(
      `https://api.postalpincode.in/postoffice?pincode=${encodeURIComponent(pin.trim())}`,
      { signal: AbortSignal.timeout(4000) }
    );
    type PinPayload = Array<{
      Status?: string;
      PostOffice?: Array<{ District?: string; State?: string }>;
    }>;
    const data = (await res.json().catch(() => null)) as PinPayload | null;
    if (!data || data[0]?.Status !== "Success" || !data[0]?.PostOffice?.[0]) return null;
    const po = data[0].PostOffice[0];
    const district = po.District ?? "";
    const state = po.State ?? "";
    if (!district && !state) return null;
    return { district, state };
  } catch {
    return null;
  }
}

// format-level pin validation by region (structural only — the live lookup above
// is what confirms a real pin for india).
export function validatePostal(country: string | null | undefined, postal: string): boolean {
  const p = postal.trim();
  if (!p) return false;
  const c = (country ?? "").trim().toUpperCase();
  if (c === "INDIA" || c === "IN") return /^\d{6}$/.test(p);
  if (c === "UNITED STATES" || c === "US" || c === "UNITED STATES OF AMERICA") return /^\d{5}(-\d{4})?$/.test(p);
  if (c === "CANADA" || c === "CA") return /^[A-V]\d[A-Z][ -]?\d[A-Z]\d$/.test(p.toUpperCase());
  if (c === "UNITED KINGDOM" || c === "GB" || c === "UK") return /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/.test(p.toUpperCase());
  if (c === "GERMANY" || c === "DE") return /^\d{5}$/.test(p);
  if (c === "FRANCE" || c === "FR") return /^\d{5}$/.test(p);
  if (c === "JAPAN" || c === "JP") return /^\d{3}-\d{4}$/.test(p);
  if (c === "BRAZIL" || c === "BR") return /^\d{5}-\d{3}$/.test(p);
  if (c === "AUSTRALIA" || c === "AU") return /^\d{4}$/.test(p);
  if (c === "SINGAPORE" || c === "SG") return /^\d{6}$/.test(p);
  if (c === "UNITED ARAB EMIRATES" || c === "AE") return /^\d{5}$/.test(p);
  // generic fallback: 3-10 chars, letters/digits/space/hyphen — strict enough to catch empty/short
  return /^[A-Z0-9][A-Z0-9\s-]{2,9}$/i.test(p);
}
