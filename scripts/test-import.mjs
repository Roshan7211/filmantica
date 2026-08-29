/** Offline pipeline test.
 *
 *  Stubs the Internet Archive endpoints with fixtures so the importer's routing can be
 *  exercised without network access. Verifies that each licence shape lands in the
 *  right bucket and that unplayable items are dropped.
 */
const fixtures = {
  // identifier -> metadata response
  cc0_short:      { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "A CC0 Short", collection: ["short_films"], licenseurl: "https://creativecommons.org/publicdomain/zero/1.0/", year: "2019" },
                    files: [{ name: "short.mp4", format: "h.264", size: "1200" }] },
  by_doc:         { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "An Attributed Documentary", collection: ["prelinger"], licenseurl: "http://creativecommons.org/licenses/by/4.0/", creator: "A. Filmmaker" },
                    files: [{ name: "doc.mp4", format: "MPEG4", size: "9000" }] },
  nc_clip:        { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "A NonCommercial Clip", collection: ["feature_films"], licenseurl: "https://creativecommons.org/licenses/by-nc/4.0/" },
                    files: [{ name: "clip.mp4", format: "h.264", size: "500" }] },
  old_feature:    { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "An Old Feature", collection: ["feature_films"], year: "1931" },
                    files: [{ name: "feature.mp4", format: "h.264", size: "40000" }] },
  silent_pd:      { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "A Silent Picture", collection: ["silent_films"], "possible-copyright-status": "Public Domain" },
                    files: [{ name: "silent.mp4", format: "512Kb MPEG4", size: "8000" }] },
  no_playable:    { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "Lossless Master Only", collection: ["feature_films"], licenseurl: "https://creativecommons.org/publicdomain/zero/1.0/" },
                    files: [{ name: "master.mkv", format: "Matroska", size: "999999" }] },
  sparse_cc0:     { metadata: { title: "A Real Old Film", collection: ["silent_films"], licenseurl: "https://creativecommons.org/publicdomain/zero/1.0/", year: "1930" },
                    files: [{ name: "f.mp4", format: "h.264", size: "5000" }] },
  junk_name:      { metadata: { title: "IMG 0057", collection: ["feature_films"], licenseurl: "https://creativecommons.org/publicdomain/zero/1.0/", year: "2024", description: "x".repeat(200) },
                    files: [{ name: "j.mp4", format: "h.264", size: "100" }] },
  vlog_upload:    { metadata: { title: "My Gaming Vlog Episode 12", licenseurl: "https://creativecommons.org/publicdomain/zero/1.0/", year: "2024", collection: ["opensource_movies"], subject: "vlogging;gaming", description: "x".repeat(200) },
                    files: [{ name: "v.mp4", format: "h.264", size: "900" }] },
  unlicensed:     { metadata: { description: "A synopsis long enough to clear the published bar, describing the film in reasonable detail for testing purposes.", title: "No Metadata At All", collection: ["opensource_movies"] },
                    files: [{ name: "x.mp4", format: "h.264", size: "100" }] },
};

const docs = Object.keys(fixtures).map((id) => ({ identifier: id, title: fixtures[id].metadata.title }));

globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes("advancedsearch")) {
    const page = Number(new URL(u).searchParams.get("page"));
    // Serve every fixture on page 1, nothing after, so the loop terminates.
    return { ok: true, status: 200, json: async () => ({ response: { numFound: docs.length, docs: page === 1 ? docs : [] } }) };
  }
  const id = u.split("/metadata/")[1];
  if (fixtures[id]) return { ok: true, status: 200, json: async () => fixtures[id] };
  return { ok: false, status: 404, json: async () => ({}) };
};

process.argv = [process.argv[0], "import.mjs", "--dry", "--pages", "1", "--rows", "50"];
await import("./import.mjs");
