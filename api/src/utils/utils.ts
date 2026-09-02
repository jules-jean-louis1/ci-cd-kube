export const parseBoolean = (val: unknown): boolean | null => {
  if (val === true) return true;
  if (val === false) return false;
  if (typeof val === "string") {
    const v = val.trim().toLowerCase();
    if (v === "true") return true;
    if (v === "false") return false;
  }
  return null;
};

export const safeParseInt = (val: unknown): number | null => {
  if (typeof val === "number") return Number.isFinite(val) ? val : null;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const isNonEmptyString = (s: unknown): boolean => typeof s === "string" && s.trim().length > 0;

export default { parseBoolean, safeParseInt, isNonEmptyString };
