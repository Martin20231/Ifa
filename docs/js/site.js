/**
 * Schematischer IFA-Lageplan (nicht die offiziellen Kartendaten).
 * Hallen-Positionen + Nachbarn für einfache Navigation.
 * Stände sind Beispiel-/Platzhalter – du kannst eigene per QR oder manuell anlegen.
 */
window.IFA_SITE = {
  halls: [
    { id: "1.1", name: "Halle 1.1", shortCode: "1.1", area: "Süd", x: 8, y: 62, w: 14, h: 16, color: "#38bdf8", neighbors: ["2.1", "cca"], hints: "Bosch" },
    { id: "2.1", name: "Halle 2.1", shortCode: "2.1", area: "Süd", x: 24, y: 62, w: 14, h: 16, color: "#38bdf8", neighbors: ["1.1", "3.1"], hints: "Miele, Liebherr, Dreame, JURA" },
    { id: "3.1", name: "Halle 3.1", shortCode: "3.1", area: "Süd", x: 40, y: 62, w: 14, h: 16, color: "#38bdf8", neighbors: ["2.1", "4.1"], hints: "Haier, Cecotec" },
    { id: "4.1", name: "Halle 4.1", shortCode: "4.1", area: "Süd", x: 56, y: 62, w: 14, h: 16, color: "#fbbf24", neighbors: ["3.1", "5.1"], hints: "Acer, Innovation Stage" },
    { id: "5.1", name: "Halle 5.1", shortCode: "5.1", area: "Süd", x: 72, y: 62, w: 14, h: 16, color: "#f472b6", neighbors: ["4.1", "6.1"], hints: "Midea" },
    { id: "6.1", name: "Halle 6.1", shortCode: "6.1", area: "Mitte", x: 72, y: 42, w: 14, h: 16, color: "#34d399", neighbors: ["5.1", "7.1a", "8.1"], hints: "Roborock, Laifen, Dreo" },
    { id: "7.1a", name: "Halle 7.1a", shortCode: "7.1a", area: "Mitte", x: 56, y: 42, w: 14, h: 8, color: "#34d399", neighbors: ["6.1", "7.1b", "4.1"] },
    { id: "7.1b", name: "Halle 7.1b", shortCode: "7.1b", area: "Mitte", x: 56, y: 50, w: 7, h: 8, color: "#34d399", neighbors: ["7.1a", "7.1c"] },
    { id: "7.1c", name: "Halle 7.1c", shortCode: "7.1c", area: "Mitte", x: 63, y: 50, w: 7, h: 8, color: "#34d399", neighbors: ["7.1b", "9"] },
    { id: "8.1", name: "Halle 8.1", shortCode: "8.1", area: "Mitte", x: 40, y: 42, w: 14, h: 16, color: "#a78bfa", neighbors: ["6.1", "9", "10.1"] },
    { id: "9", name: "Halle 9", shortCode: "9", area: "Nord", x: 24, y: 42, w: 14, h: 16, color: "#a78bfa", neighbors: ["8.1", "10.1", "7.1c"] },
    { id: "10.1", name: "Halle 10.1", shortCode: "10.1", area: "Nord", x: 8, y: 42, w: 14, h: 16, color: "#a78bfa", neighbors: ["9", "11.1"] },
    { id: "11.1", name: "Halle 11.1", shortCode: "11.1", area: "Nord", x: 8, y: 22, w: 14, h: 16, color: "#fb7185", neighbors: ["10.1", "12"], hints: "AUX, Vevor" },
    { id: "12", name: "Halle 12", shortCode: "12", area: "Ost", x: 24, y: 22, w: 14, h: 16, color: "#fb7185", neighbors: ["11.1", "13"], hints: "Bodyfriend" },
    { id: "13", name: "Halle 13", shortCode: "13", area: "Ost", x: 40, y: 22, w: 14, h: 16, color: "#fb7185", neighbors: ["12", "14"] },
    { id: "14", name: "Halle 14", shortCode: "14", area: "Ost", x: 56, y: 22, w: 14, h: 16, color: "#f472b6", neighbors: ["13", "15"], hints: "Beauty Hub, Withings" },
    { id: "15", name: "Halle 15", shortCode: "15", area: "Ost", x: 72, y: 22, w: 14, h: 16, color: "#fbbf24", neighbors: ["14", "17"], hints: "Merach" },
    { id: "17", name: "Halle 17", shortCode: "17", area: "Ost", x: 72, y: 4, w: 14, h: 14, color: "#38bdf8", neighbors: ["15", "jg"], hints: "TikTok, Prusa, Makera" },
    { id: "jg", name: "Japanese Garden", shortCode: "JG", area: "Outdoor", x: 56, y: 4, w: 14, h: 14, color: "#4ade80", neighbors: ["17", "12"] },
    { id: "cca", name: "City Cube / CCA", shortCode: "CCA", area: "City Cube", x: 8, y: 82, w: 22, h: 12, color: "#94a3b8", neighbors: ["1.1", "sg"] },
    { id: "sg", name: "Sommergarten", shortCode: "SG", area: "Outdoor", x: 34, y: 82, w: 22, h: 12, color: "#4ade80", neighbors: ["cca", "h27"] },
    { id: "h27", name: "Hub 27", shortCode: "H27", area: "Hub", x: 60, y: 82, w: 22, h: 12, color: "#f59e0b", neighbors: ["sg"] }
  ],

  /** Beispielstände – echte Stände legst du per QR / manuell an */
  stands: [
    { id: "s-miele", hallId: "2.1", name: "Miele", booth: "H2.1-101", x: 20, y: 30 },
    { id: "s-liebherr", hallId: "2.1", name: "Liebherr", booth: "H2.1-104", x: 55, y: 30 },
    { id: "s-bosch", hallId: "1.1", name: "Bosch", booth: "H1.1-100", x: 40, y: 40 },
    { id: "s-haier", hallId: "3.1", name: "Haier", booth: "H3.1-101", x: 35, y: 35 },
    { id: "s-midea", hallId: "5.1", name: "Midea", booth: "H5.1-101", x: 40, y: 40 },
    { id: "s-roborock", hallId: "6.1", name: "Roborock", booth: "H6.1-120", x: 30, y: 35 },
    { id: "s-anker", hallId: "6.1", name: "Anker / eufy", booth: "H6.1-140", x: 65, y: 40 },
    { id: "s-tiktok", hallId: "17", name: "TikTok", booth: "H17-200", x: 45, y: 40 },
    { id: "s-prusa", hallId: "17", name: "Prusa Research", booth: "H17-215", x: 70, y: 55 },
    { id: "s-lg", hallId: "cca", name: "LG Electronics", booth: "CCA-A", x: 40, y: 40 },
    { id: "s-samsung", hallId: "cca", name: "Samsung", booth: "CCA-B", x: 65, y: 40 },
    { id: "s-xiaomi", hallId: "4.1", name: "Xiaomi", booth: "H4.1-110", x: 40, y: 45 }
  ]
};

window.IFA_HALLS = window.IFA_SITE.halls;
window.IFA_STANDS = window.IFA_SITE.stands;
window.IFA_AREA_ORDER = ["Süd", "Mitte", "Nord", "Ost", "Outdoor", "City Cube", "Hub"];
