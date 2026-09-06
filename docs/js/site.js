/**
 * IFA Berlin – Lageplan nach offiziellem Messeplan.
 * viewBox 0..100, Nord ≈ oben. Farben = Themenwelten der IFA-Legende.
 * floor: 1 = EG (.1), 2 = OG (.2)
 */
window.IFA_CATEGORIES = {
  appliances: { name: "Home Appliances", color: "#2563eb" },
  smartHome: { name: "Smart Home", color: "#dc2626" },
  connectivity: { name: "Communication", color: "#38bdf8" },
  computing: { name: "Computing & Gaming", color: "#eab308" },
  audio: { name: "Audio", color: "#0f766e" },
  beauty: { name: "Beauty Tech", color: "#ea580c" },
  next: { name: "IFA Next", color: "#84cc16" },
  content: { name: "Content Creation", color: "#4ade80" },
  entertainment: { name: "Home & Entertainment", color: "#e879f9" },
  global: { name: "IFA Global Markets", color: "#6b21a8" },
  mobility: { name: "Mobility", color: "#a855f7" },
  outdoor: { name: "Outdoor / Special", color: "#16a34a" }
};

window.IFA_SITE = {
  /**
   * Ring um den Sommergarten – Positionen am offiziellen Plan:
   * Süd: CityCube + 1–7 · Ost: 8–15 · Nord: 16–20/Palais · West: hub27, 21–26
   */
  halls: [
    // —— Süd: CityCube ——
    { id: "citycube-a", name: "CityCube A", shortCode: "A", area: "Süd", floor: 1, category: "mobility", x: 36, y: 90, w: 13, h: 7, neighbors: ["citycube-b", "7.1a", "1.1"], hints: "Retail Innovation Zone" },
    { id: "citycube-b", name: "CityCube B", shortCode: "B", area: "Süd", floor: 1, category: "mobility", x: 51, y: 90, w: 13, h: 7, neighbors: ["citycube-a", "7.1a"], hints: "Mobility" },

    // —— Südwest: Hallen 1–6 (EG blau / OG rot·cyan·gelb) ——
    { id: "1.1", name: "Halle 1.1", shortCode: "1.1", area: "Südwest", floor: 1, category: "appliances", x: 14, y: 78, w: 10, h: 9, neighbors: ["1.2", "2.1", "citycube-a", "5.1"], hints: "Bosch, Ferre" },
    { id: "1.2", name: "Halle 1.2", shortCode: "1.2", area: "Südwest", floor: 2, category: "smartHome", x: 14, y: 78, w: 10, h: 9, neighbors: ["1.1", "2.2"], hints: "Smart Home" },
    { id: "2.1", name: "Halle 2.1", shortCode: "2.1", area: "Südwest", floor: 1, category: "appliances", x: 25, y: 78, w: 10, h: 9, neighbors: ["1.1", "2.2", "3.1"], hints: "Miele, Liebherr, JURA, Kärcher" },
    { id: "2.2", name: "Halle 2.2", shortCode: "2.2", area: "Südwest", floor: 2, category: "smartHome", x: 25, y: 78, w: 10, h: 9, neighbors: ["2.1", "1.2", "3.2"], hints: "Smart Home" },
    { id: "3.1", name: "Halle 3.1", shortCode: "3.1", area: "West", floor: 1, category: "appliances", x: 14, y: 66, w: 10, h: 9, neighbors: ["2.1", "3.2", "4.1"], hints: "Haier, Cecotec" },
    { id: "3.2", name: "Halle 3.2", shortCode: "3.2", area: "West", floor: 2, category: "connectivity", x: 14, y: 66, w: 10, h: 9, neighbors: ["3.1", "2.2", "4.2"], hints: "Communication" },
    { id: "4.1", name: "Halle 4.1", shortCode: "4.1", area: "West", floor: 1, category: "appliances", x: 25, y: 66, w: 10, h: 9, neighbors: ["3.1", "4.2", "5.1"], hints: "Beurer, Severin, COSORI" },
    { id: "4.2", name: "Halle 4.2", shortCode: "4.2", area: "West", floor: 2, category: "connectivity", x: 25, y: 66, w: 10, h: 9, neighbors: ["4.1", "3.2", "5.2"], hints: "Communication" },
    { id: "5.1", name: "Halle 5.1", shortCode: "5.1", area: "West", floor: 1, category: "appliances", x: 14, y: 54, w: 10, h: 9, neighbors: ["4.1", "5.2", "6.1", "1.1"], hints: "Midea" },
    { id: "5.2", name: "Halle 5.2", shortCode: "5.2", area: "West", floor: 2, category: "connectivity", x: 14, y: 54, w: 10, h: 9, neighbors: ["5.1", "4.2", "6.2"], hints: "iZone" },
    { id: "6.1", name: "Halle 6.1", shortCode: "6.1", area: "West", floor: 1, category: "appliances", x: 25, y: 54, w: 10, h: 9, neighbors: ["5.1", "6.2", "7.1a", "sg"], hints: "Electrolux, Polti, Ooni" },
    { id: "6.2", name: "Halle 6.2", shortCode: "6.2", area: "West", floor: 2, category: "computing", x: 25, y: 54, w: 10, h: 9, neighbors: ["6.1", "5.2", "7.2a"], hints: "Indie Game Area" },

    // —— Südost-Reihe: 7.1a–c, 8.1, 9 ——
    { id: "7.1a", name: "Halle 7.1a", shortCode: "7.1a", area: "Südost", floor: 1, category: "appliances", x: 66, y: 82, w: 9, h: 7, neighbors: ["6.1", "7.1b", "7.2a", "citycube-a"] },
    { id: "7.1b", name: "Halle 7.1b", shortCode: "7.1b", area: "Südost", floor: 1, category: "appliances", x: 76, y: 82, w: 9, h: 7, neighbors: ["7.1a", "7.1c", "7.2b"] },
    { id: "7.1c", name: "Halle 7.1c", shortCode: "7.1c", area: "Südost", floor: 1, category: "appliances", x: 86, y: 78, w: 9, h: 8, neighbors: ["7.1b", "8.1", "7.2c"] },
    { id: "7.2a", name: "Halle 7.2a", shortCode: "7.2a", area: "Südost", floor: 2, category: "computing", x: 66, y: 82, w: 9, h: 7, neighbors: ["6.2", "7.1a", "7.2b"] },
    { id: "7.2b", name: "Halle 7.2b", shortCode: "7.2b", area: "Südost", floor: 2, category: "computing", x: 76, y: 82, w: 9, h: 7, neighbors: ["7.2a", "7.1b", "7.2c"] },
    { id: "7.2c", name: "Halle 7.2c", shortCode: "7.2c", area: "Südost", floor: 2, category: "computing", x: 86, y: 78, w: 9, h: 8, neighbors: ["7.2b", "7.1c", "8.2"] },
    { id: "8.1", name: "Halle 8.1", shortCode: "8.1", area: "Ost", floor: 1, category: "appliances", x: 86, y: 66, w: 9, h: 9, neighbors: ["7.1c", "8.2", "9"] },
    { id: "8.2", name: "Halle 8.2", shortCode: "8.2", area: "Ost", floor: 2, category: "entertainment", x: 86, y: 66, w: 9, h: 9, neighbors: ["8.1", "7.2c", "10.2"] },
    { id: "9", name: "Halle 9", shortCode: "9", area: "Ost", floor: 1, category: "appliances", x: 86, y: 54, w: 9, h: 9, neighbors: ["8.1", "10.1", "sg"] },

    // —— Ost innen (zum Garten): 10 / 11 ——
    { id: "10.1", name: "Halle 10.1", shortCode: "10.1", area: "Ost", floor: 1, category: "appliances", x: 74, y: 48, w: 10, h: 8, neighbors: ["9", "10.2", "11.1", "sg"] },
    { id: "10.2", name: "Halle 10.2", shortCode: "10.2", area: "Ost", floor: 2, category: "audio", x: 74, y: 48, w: 10, h: 8, neighbors: ["10.1", "8.2", "11.2"] },
    { id: "11.1", name: "Halle 11.1", shortCode: "11.1", area: "Ost", floor: 1, category: "appliances", x: 74, y: 38, w: 10, h: 8, neighbors: ["10.1", "11.2", "12"], hints: "AUX, Vevor" },
    { id: "11.2", name: "Halle 11.2", shortCode: "11.2", area: "Ost", floor: 2, category: "audio", x: 74, y: 38, w: 10, h: 8, neighbors: ["11.1", "10.2", "12"] },

    // —— Ost außen: Beauty 12–15 ——
    { id: "12", name: "Halle 12", shortCode: "12", area: "Nordost", floor: 1, category: "beauty", x: 86, y: 38, w: 9, h: 8, neighbors: ["11.1", "13"], hints: "Bodyfriend" },
    { id: "13", name: "Halle 13", shortCode: "13", area: "Nordost", floor: 1, category: "beauty", x: 86, y: 28, w: 9, h: 8, neighbors: ["12", "14"] },
    { id: "14", name: "Halle 14", shortCode: "14", area: "Nordost", floor: 1, category: "beauty", x: 86, y: 18, w: 9, h: 8, neighbors: ["13", "15"], hints: "Beauty Hub" },
    { id: "15", name: "Halle 15", shortCode: "15", area: "Nordost", floor: 1, category: "beauty", x: 86, y: 8, w: 9, h: 8, neighbors: ["14", "16"] },

    // —— Nordost: Funkturm / IFA Next ——
    { id: "16", name: "Halle 16", shortCode: "16", area: "Nord", floor: 1, category: "next", x: 72, y: 8, w: 11, h: 8, neighbors: ["15", "17"] },
    { id: "17", name: "Halle 17", shortCode: "17", area: "Nord", floor: 1, category: "next", x: 58, y: 8, w: 12, h: 8, neighbors: ["16", "palais", "sg"], hints: "TikTok, Prusa, Makera · Funkturm" },

    // —— Nord: Palais & Content / Entertainment ——
    { id: "palais", name: "Palais", shortCode: "Palais", area: "Nord", floor: 1, category: "content", x: 44, y: 8, w: 12, h: 8, neighbors: ["17", "20", "19", "sg"], hints: "Creator Hub" },
    { id: "20", name: "Halle 20", shortCode: "20", area: "Nord", floor: 1, category: "content", x: 32, y: 6, w: 10, h: 7, neighbors: ["palais", "19", "21"] },
    { id: "19", name: "Halle 19", shortCode: "19", area: "Nord", floor: 1, category: "entertainment", x: 20, y: 6, w: 10, h: 7, neighbors: ["20", "18", "palais"] },
    { id: "18", name: "Halle 18", shortCode: "18", area: "Nordwest", floor: 1, category: "entertainment", x: 8, y: 10, w: 10, h: 8, neighbors: ["19", "21"] },

    // —— Nordwest: Entertainment-Reihe ——
    { id: "21", name: "Halle 21", shortCode: "21", area: "Nordwest", floor: 1, category: "entertainment", x: 8, y: 20, w: 10, h: 8, neighbors: ["18", "20", "22"] },
    { id: "22", name: "Halle 22", shortCode: "22", area: "Nordwest", floor: 1, category: "entertainment", x: 8, y: 30, w: 10, h: 8, neighbors: ["21", "23", "sg"] },
    { id: "23", name: "Halle 23", shortCode: "23", area: "Nordwest", floor: 1, category: "entertainment", x: 8, y: 40, w: 10, h: 8, neighbors: ["22", "h27", "24"] },

    // —— West: hub27, Next, Global Markets ——
    { id: "h27", name: "hub27", shortCode: "h27", area: "West", floor: 1, category: "entertainment", x: 2, y: 48, w: 10, h: 14, neighbors: ["23", "24", "25", "26", "5.1", "sg"], hints: "hub27" },
    { id: "24", name: "Halle 24", shortCode: "24", area: "West", floor: 1, category: "entertainment", x: 2, y: 36, w: 10, h: 8, neighbors: ["23", "25", "h27"], hints: "Reseller Park" },
    { id: "25", name: "Halle 25", shortCode: "25", area: "West", floor: 1, category: "next", x: 2, y: 64, w: 10, h: 8, neighbors: ["24", "26", "h27"], hints: "Dream Stage · IFA Next" },
    { id: "26", name: "Halle 26", shortCode: "26", area: "West", floor: 1, category: "global", x: 2, y: 74, w: 10, h: 10, neighbors: ["25", "h27", "1.1"], hints: "IFA Global Markets B2B" },

    // —— Mitte ——
    { id: "sg", name: "Sommergarten", shortCode: "SG", area: "Mitte", floor: 1, category: "outdoor", x: 38, y: 28, w: 32, h: 22, neighbors: ["6.1", "9", "10.1", "17", "palais", "22", "h27"], hints: "Outdoor Cooking · Creator Stage", mapRole: "park" }
  ],

  stands: [
    // Halle 1.1
    { id: "s-bosch", hallId: "1.1", name: "Bosch Home Appliances", booth: "H1.1", x: 28, y: 28 },
    { id: "s-ferre", hallId: "1.1", name: "Ferre", booth: "H1.1-105", x: 62, y: 55 },
    // Halle 2.1
    { id: "s-miele", hallId: "2.1", name: "Miele", booth: "H2.1-101", x: 18, y: 28 },
    { id: "s-jura", hallId: "2.1", name: "JURA", booth: "H2.1-103", x: 70, y: 28 },
    { id: "s-liebherr", hallId: "2.1", name: "Liebherr", booth: "H2.1-104", x: 42, y: 52 },
    { id: "s-kaercher", hallId: "2.1", name: "Kärcher", booth: "H2.1", x: 68, y: 62 },
    // Halle 3.1
    { id: "s-haier", hallId: "3.1", name: "Haier", booth: "H3.1-101", x: 22, y: 30 },
    { id: "s-cecotec", hallId: "3.1", name: "Cecotec", booth: "H3.1-102", x: 58, y: 30 },
    { id: "s-schneider", hallId: "3.1", name: "Schneider", booth: "H3.1", x: 22, y: 58 },
    { id: "s-sang", hallId: "3.1", name: "SANG", booth: "H3.1", x: 58, y: 58 },
    // Halle 4.1
    { id: "s-h41-101", hallId: "4.1", name: "2 Exhibitors", booth: "H4.1-101", x: 20, y: 22 },
    { id: "s-gtech", hallId: "4.1", name: "Gtech", booth: "H4.1", x: 58, y: 18 },
    { id: "s-nivona", hallId: "4.1", name: "Nivona", booth: "H4.1", x: 78, y: 18 },
    { id: "s-fakir", hallId: "4.1", name: "Fakir-Hausgeräte", booth: "H4.1", x: 58, y: 34 },
    { id: "s-caso", hallId: "4.1", name: "CASO GmbH", booth: "H4.1", x: 78, y: 34 },
    { id: "s-beurer", hallId: "4.1", name: "Beurer GmbH", booth: "H4.1", x: 58, y: 50 },
    { id: "s-severin", hallId: "4.1", name: "Severin", booth: "H4.1", x: 78, y: 50 },
    { id: "s-solis", hallId: "4.1", name: "Solis", booth: "H4.1", x: 20, y: 62 },
    { id: "s-russell", hallId: "4.1", name: "Russell Hobbs", booth: "H4.1", x: 42, y: 62 },
    { id: "s-rommelsbacher", hallId: "4.1", name: "Rommelsbacher", booth: "H4.1", x: 64, y: 62 },
    { id: "s-cosori", hallId: "4.1", name: "COSORI", booth: "H4.1", x: 82, y: 62 },
    // Halle 5.1
    { id: "s-midea", hallId: "5.1", name: "Midea Electric Trading", booth: "H5.1-101", x: 36, y: 36 },
    // Halle 6.1
    { id: "s-ufesa", hallId: "6.1", name: "Ufesa", booth: "H6.1", x: 12, y: 16 },
    { id: "s-ooni", hallId: "6.1", name: "Ooni", booth: "H6.1", x: 34, y: 16 },
    { id: "s-afra", hallId: "6.1", name: "AFRA", booth: "H6.1", x: 56, y: 16 },
    { id: "s-kuvings", hallId: "6.1", name: "Kuvings", booth: "H6.1", x: 78, y: 16 },
    { id: "s-flama", hallId: "6.1", name: "FLAMA", booth: "H6.1", x: 12, y: 36 },
    { id: "s-polti", hallId: "6.1", name: "Polti", booth: "H6.1", x: 40, y: 36 },
    { id: "s-singer", hallId: "6.1", name: "SINGER Ultimate", booth: "H6.1", x: 68, y: 36 },
    { id: "s-electrolux", hallId: "6.1", name: "Electrolux", booth: "H6.1", x: 40, y: 58 },
    { id: "s-lounge61", hallId: "6.1", name: "Lounge", booth: "H6.1", x: 72, y: 58 },
    // Weitere
    { id: "s-tiktok", hallId: "17", name: "TikTok", booth: "H17-200", x: 45, y: 40 },
    { id: "s-prusa", hallId: "17", name: "Prusa Research", booth: "H17-215", x: 70, y: 55 }
  ]
};

window.IFA_SITE.halls.forEach(function (h) {
  var cat = window.IFA_CATEGORIES[h.category];
  h.color = cat ? cat.color : "#64748b";
});

/** Paare EG↔OG für die Ebenen-Umschaltung (gleiche Fläche) */
window.IFA_FLOOR_PAIRS = {
  "1.1": "1.2", "1.2": "1.1",
  "2.1": "2.2", "2.2": "2.1",
  "3.1": "3.2", "3.2": "3.1",
  "4.1": "4.2", "4.2": "4.1",
  "5.1": "5.2", "5.2": "5.1",
  "6.1": "6.2", "6.2": "6.1",
  "7.1a": "7.2a", "7.2a": "7.1a",
  "7.1b": "7.2b", "7.2b": "7.1b",
  "7.1c": "7.2c", "7.2c": "7.1c",
  "8.1": "8.2", "8.2": "8.1",
  "10.1": "10.2", "10.2": "10.1",
  "11.1": "11.2", "11.2": "11.1"
};

window.IFA_HALLS = window.IFA_SITE.halls;
window.IFA_STANDS = window.IFA_SITE.stands;
window.IFA_AREA_ORDER = ["Süd", "Südwest", "Südost", "West", "Ost", "Nordost", "Nord", "Nordwest", "Mitte"];
