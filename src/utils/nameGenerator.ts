const wordList: string[] = [
  "Cuchulainn", "Maeve", "BrianBoru", "OscarWilde", "JamesJoyce",
  "WBYeats", "SaintPatrick", "GraceOMalley", "FionnMacCumhaill",
  "Brendan", "Emer", "Deirdre", "Medb", "Liadin", "Colmcille",
  "JonathanSwift", "SamuelBeckett", "SeamusHeaney", "Enya",
  "DoloresKeane", "Niamh", "Aengus", "Balor", "Dagda",
  "MichaelCollins", "CharlieHaughey", "Bono", "SineadOConnor",
  "VanMorrison", "U2", "LiamNeeson", "PierceBrosnan", "MaryRobinson",
  "MaureenO Hara", "RoddyDoyle", "BrendanGleeson", "Hozier", "SaoirseRonan",
  "GeorgeBernardShaw", "PhilLynott", "TheCranberries", "Jameson", "Guinness"
];

/**
 * Generates a random name by combining Irish historical, mythic, literary, and cultural figures.
 * Note: Does not support seeding like the Python version for simplicity in browser JS.
 * @param numWords The number of words to combine (defaults to 3).
 * @returns A string representing the generated name (e.g., "OscarWilde_SeamusHeaney").
 */
export function generateIrishName(numWords: number = 2): string { // Default to 2 words
  if (numWords <= 0) {
    return "";
  }
  if (numWords > wordList.length) {
    console.warn(`Requested ${numWords} words, but only ${wordList.length} are available. Using all available words.`);
    numWords = wordList.length;
  }

  // Simple shuffle and pick first numWords elements
  const shuffled = [...wordList].sort(() => 0.5 - Math.random());
  const selectedWords = shuffled.slice(0, numWords);

  return selectedWords.join('_');
}