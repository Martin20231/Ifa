import Foundation

/// Hallenkatalog angelehnt an die offizielle IFA-App / Messe Berlin.
enum HallSeed {
    struct Definition: Hashable {
        let name: String
        let shortCode: String
        let area: String
        let sortOrder: Int
        let mapRow: Int
        let mapColumn: Int
        let hints: String
    }

    static let all: [Definition] = {
        var items: [Definition] = []
        var order = 0

        func add(
            _ name: String,
            code: String? = nil,
            area: String,
            row: Int,
            col: Int,
            hints: String = ""
        ) {
            items.append(
                Definition(
                    name: name,
                    shortCode: code ?? name.replacingOccurrences(of: "Halle ", with: ""),
                    area: area,
                    sortOrder: order,
                    mapRow: row,
                    mapColumn: col,
                    hints: hints
                )
            )
            order += 1
        }

        // Eingang Süd
        add("Halle 1.1", area: "Eingang Süd", row: 0, col: 0, hints: "Bosch")
        add("Halle 2.1", area: "Eingang Süd", row: 0, col: 1, hints: "Miele, Liebherr, Dreame, JURA")
        add("Halle 3.1", area: "Eingang Süd", row: 0, col: 2, hints: "Haier, Cecotec")
        add("Halle 4.1", area: "Eingang Süd", row: 0, col: 3, hints: "Acer, Innovation Stage")
        add("Halle 5.1", area: "Eingang Süd", row: 1, col: 0, hints: "Midea")

        // Mitte
        add("Halle 6.1", area: "Mitte", row: 1, col: 1, hints: "Roborock, Laifen, Dreo, Cosori, Beurer")
        add("Halle 7.1a", area: "Mitte", row: 1, col: 2)
        add("Halle 7.1b", area: "Mitte", row: 1, col: 3)
        add("Halle 7.1c", area: "Mitte", row: 2, col: 0)
        add("Halle 8.1", area: "Mitte", row: 2, col: 1)

        // Nord
        add("Halle 9", area: "Nord", row: 2, col: 2)
        add("Halle 10.1", area: "Nord", row: 2, col: 3)
        add("Halle 11.1", area: "Nord", row: 3, col: 0, hints: "AUX, Vevor")

        // Ost
        add("Halle 12", area: "Ost", row: 3, col: 1, hints: "Bodyfriend, Medivon")
        add("Halle 13", area: "Ost", row: 3, col: 2)
        add("Halle 14", area: "Ost", row: 3, col: 3, hints: "Beauty Hub, Withings")
        add("Halle 15", area: "Ost", row: 4, col: 0, hints: "Merach, Wavytall")
        add("Halle 17", area: "Ost", row: 4, col: 1, hints: "TikTok, Prusa Research, Makera")

        // Sonderflächen
        add("Japanese Garden", code: "JG", area: "Outdoor", row: 4, col: 2)
        add("City Cube / CCA", code: "CCA", area: "City Cube", row: 4, col: 3)
        add("Sommergarten", code: "SG", area: "Outdoor", row: 5, col: 0)
        add("Hub 27", code: "H27", area: "Hub", row: 5, col: 1)

        return items
    }()
}
