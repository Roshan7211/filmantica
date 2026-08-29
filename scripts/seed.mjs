/** Generates placeholder catalogue data so the site is browsable before the
 *  first importer run. Every record is marked source:"seed-demo" and
 *  licenseVerified:false — the UI surfaces that state rather than hiding it. */
import { writeFile, mkdir } from "node:fs/promises";

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const titles = [
  ["Night of the Living Dead", 1968, "George A. Romero", ["Horror", "Cult"], 96,
   "Strangers barricade themselves inside a farmhouse as the recently dead rise and attack the living.",
   ["Duane Jones", "Judith O'Dea"], true, true],
  ["Nosferatu", 1922, "F. W. Murnau", ["Horror", "Silent"], 94,
   "An estate agent travels to a remote castle and returns having drawn a predatory count toward his home town.",
   ["Max Schreck", "Greta Schroder"], true, false],
  ["The Cabinet of Dr. Caligari", 1920, "Robert Wiene", ["Horror", "Silent"], 76,
   "A carnival hypnotist and the sleepwalker he commands are linked to a series of killings, told in warped painted sets.",
   ["Werner Krauss", "Conrad Veidt"], true, false],
  ["The General", 1926, "Buster Keaton", ["Comedy", "Silent", "Action"], 78,
   "A railway engineer pursues his stolen locomotive through enemy lines in a feature-length chase.",
   ["Buster Keaton", "Marion Mack"], true, false],
  ["Sherlock Jr.", 1924, "Buster Keaton", ["Comedy", "Silent"], 45,
   "A projectionist dreams himself into the film he is screening and becomes its detective hero.",
   ["Buster Keaton", "Kathryn McGuire"], true, false],
  ["Plan 9 from Outer Space", 1959, "Edward D. Wood Jr.", ["Sci-Fi", "Cult"], 79,
   "Aliens raise the dead in a Californian cemetery as part of a scheme to stop humanity destroying the universe.",
   ["Bela Lugosi", "Tor Johnson"], true, false],
  ["Carnival of Souls", 1962, "Herk Harvey", ["Horror", "Cult"], 78,
   "The sole survivor of a car crash takes work as a church organist and is followed by a pale, silent figure.",
   ["Candace Hilligoss"], true, false],
  ["Detour", 1945, "Edgar G. Ulmer", ["Film Noir", "Drama"], 68,
   "A hitchhiking pianist heading west is drawn into a spiral of bad luck and worse decisions.",
   ["Tom Neal", "Ann Savage"], true, false],
  ["D.O.A.", 1949, "Rudolph Mate", ["Film Noir", "Thriller"], 83,
   "A man walks into a police station to report a murder — his own — and retraces the days he has left.",
   ["Edmond O'Brien"], true, false],
  ["The Phantom of the Opera", 1925, "Rupert Julian", ["Horror", "Silent"], 93,
   "A disfigured composer haunting the Paris Opera House takes a young soprano under his violent patronage.",
   ["Lon Chaney", "Mary Philbin"], true, false],
  ["Battleship Potemkin", 1925, "Sergei Eisenstein", ["Drama", "Silent"], 75,
   "A crew's mutiny over rotten rations becomes an uprising, staged in landmark montage.",
   ["Aleksandr Antonov"], true, false],
  ["His Girl Friday", 1940, "Howard Hawks", ["Comedy", "Drama"], 92,
   "An editor schemes to keep his departing star reporter on one last story, at overlapping speed.",
   ["Cary Grant", "Rosalind Russell"], true, false],
  // Deliberately held back: status is genuinely contested, so the gate stops them.
  ["Metropolis", 1927, "Fritz Lang", ["Sci-Fi", "Silent"], 153,
   "In a stratified future city, an industrialist's son and a machine-double provoke revolt among the workers below.",
   ["Brigitte Helm", "Alfred Abel"], false, false],
  ["Charade", 1963, "Stanley Donen", ["Thriller", "Comedy"], 113,
   "A widow discovers her husband's associates all want a fortune she cannot find.",
   ["Cary Grant", "Audrey Hepburn"], false, false],
];

const now = new Date().toISOString();

const movies = titles.map(([title, year, director, genres, mins, description, cast, isPublic, isFeatured]) => {
  const slug = slugify(String(title));
  const sourceId = slug.replace(/-/g, "_");
  return {
    id: slug,
    title, slug, description, year,
    duration: mins * 60,
    language: "en",
    director,
    cast,
    genres,
    posterUrl: `https://archive.org/services/img/${sourceId}`,
    backdropUrl: null,
    source: "seed-demo",
    sourceId,
    sourceUrl: `https://archive.org/details/${sourceId}`,
    videoUrl: null,
    downloadUrl: null,
    license: isPublic ? "Public Domain (unverified placeholder)" : "Contested — held for review",
    licenseUrl: null,
    licenseVerified: false,
    creator: director,
    attributionText: null,
    reviewStatus: isPublic ? "approved" : "pending",
    isPublic,
    isFeatured,
    createdAt: now,
    updatedAt: now,
  };
});

await mkdir("data", { recursive: true });
await writeFile("data/movies.json", JSON.stringify(movies, null, 2));
console.log(`seeded ${movies.length} records (${movies.filter(m => m.isPublic).length} public, ${movies.filter(m => !m.isPublic).length} held)`);
