/**
 * Transforms plan feature lists when the WA Credit add-on is disabled platform-wide.
 *
 * When disabled:
 * - "Kredit WhatsApp 5000 pesan" (or any "Kredit WhatsApp ... pesan" line) is replaced
 *   with "Notifikasi WhatsApp Unlimited".
 * - "Notifikasi WhatsApp" is upgraded to "Notifikasi WhatsApp Unlimited".
 * - Basic plan also receives "Notifikasi WhatsApp Unlimited" if not already present.
 */
const UNLIMITED = "Notifikasi WhatsApp Unlimited";

const transformOne = (features: string[]): string[] => {
  const out: string[] = [];
  let added = false;
  for (const f of features) {
    if (/^Kredit WhatsApp/i.test(f)) {
      if (!added) {
        out.push(UNLIMITED);
        added = true;
      }
      continue;
    }
    if (/^Notifikasi WhatsApp$/i.test(f)) {
      if (!added) {
        out.push(UNLIMITED);
        added = true;
      }
      continue;
    }
    out.push(f);
  }
  return out;
};

export function transformPlanFeatures<T extends { name?: string; features?: any }>(
  plans: T[],
  waCreditEnabled: boolean
): T[] {
  if (waCreditEnabled) return plans;
  return plans.map((p) => {
    const feats: string[] = Array.isArray(p.features) ? [...p.features] : [];
    let next = transformOne(feats);
    // Basic plan also gets unlimited WA notif
    if (p.name === "Basic" && !next.some((f) => /Notifikasi WhatsApp/i.test(f))) {
      next.push(UNLIMITED);
    }
    return { ...p, features: next };
  });
}

export function transformFeatureList(features: string[], waCreditEnabled: boolean, planName?: string): string[] {
  if (waCreditEnabled) return features;
  let next = transformOne(features);
  if (planName === "Basic" && !next.some((f) => /Notifikasi WhatsApp/i.test(f))) {
    next.push(UNLIMITED);
  }
  return next;
}
