// utils/normalizePhone.ts
export type Region = "IR" | "US";

export function normalizePhone(raw: string, region: Region = "IR"): string {
    if (!raw) return "";

    // 1) Trim & remove spaces, tabs, newlines, hyphens, parentheses, dots
    let s = raw.trim().replace(/[\s\-().]/g, "");

    // 2) Convert "00" international prefix -> "+"
    if (s.startsWith("00")) s = "+" + s.slice(2);

    // 3) If no "+" yet, assume local for given region
    if (!s.startsWith("+")) {
        if (region === "IR") {
            // Accept "09xxxxxxxxx" or "9xxxxxxxxx"
            if (s.startsWith("0")) s = s.slice(1); // drop leading 0 after +98 rule
            s = "+98" + s;
        } else if (region === "US") {
            // Normalize typical US inputs: 10 or 11 digits with/without leading 1
            // Remove any non-digits now that we know it's US
            s = s.replace(/\D/g, "");
            if (s.length === 11 && s.startsWith("1")) s = s.slice(1);
            if (s.length !== 10) return ""; // invalid local US number
            s = "+1" + s;
        }
    }

    // 4) If it starts with +98 (Iran): drop any '0' immediately after +98
    if (s.startsWith("+98")) {
        // examples: +980912345678 -> +98912345678; +989123456789 stays
        const rest = s.slice(3);
        const normalizedRest = rest.startsWith("0") ? rest.slice(1) : rest;
        s = "+98" + normalizedRest;

        // Basic length guard for Iran mobile/landline (8–10 digits typical after country code)
        const digitsAfter = s.slice(3).replace(/\D/g, "");
        if (digitsAfter.length < 8 || digitsAfter.length > 10) {
            // you can relax or remove this guard if you have landline edge-cases
            // return null;
        }
    }

    // 5) If it starts with +1 (US): ensure 10 digits after +1
    if (s.startsWith("+1")) {
        const rest = s.slice(2).replace(/\D/g, "");
        if (rest.length === 11 && rest.startsWith("1")) {
            s = "+1" + rest.slice(1);
        } else if (rest.length !== 10) {
            return "";
        } else {
            s = "+1" + rest;
        }
    }

    // 6) Final sanity: keep only "+" + digits
    if (!/^\+\d+$/.test(s)) return "";

    return s;
}
