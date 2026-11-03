// General value generation utilities (the equivalent of Helpers/LogicHelper)

/** Random string of lowercase letters and digits. */
export function randomString(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

/** String of random digits, e.g. for a postal code. */
export function randomDigits(length = 5): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

/** Converts the first letter to uppercase. */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
