// Selenium: Helpers/LogicHelper (generator karakter, dll)
export function randomString(length = 6): string {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function randomDigits(length = 5): string {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
