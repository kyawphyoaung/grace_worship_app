import { strings, type Language, type StringKey } from "./strings";

export type { Language, StringKey };
export { strings };

function getLeaf(path: StringKey): { en: string; mm: string } {
  const parts = path.split(".");
  let current: unknown = strings;

  for (const part of parts) {
    if (
      typeof current !== "object" ||
      current === null ||
      !(part in current)
    ) {
      throw new Error(`Missing i18n key: ${path}`);
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (
    typeof current !== "object" ||
    current === null ||
    !("en" in current) ||
    !("mm" in current)
  ) {
    throw new Error(`Invalid i18n leaf: ${path}`);
  }

  return current as { en: string; mm: string };
}

export function t(key: StringKey, lang: Language): string {
  const leaf = getLeaf(key);
  return leaf[lang];
}

/** Replace `{name}` (and other `{key}`) placeholders in an i18n string. */
export function tf(
  key: StringKey,
  lang: Language,
  vars: Record<string, string>,
): string {
  let out = t(key, lang);
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v);
  }
  return out;
}
