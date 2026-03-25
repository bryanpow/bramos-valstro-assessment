// Returns a Wikipedia search URL for a given character. 
export const wikipediaSearchUrl = (name: string): string =>
  `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name.trim())}`;
