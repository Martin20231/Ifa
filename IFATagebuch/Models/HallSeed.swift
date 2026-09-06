import Foundation

/// Statische Katalogdaten typischer IFA-Berlin-Hallen & Sonderflächen.
enum HallSeed {
    struct Definition: Hashable {
        let name: String
        let shortCode: String
        let area: String
        let sortOrder: Int
        let mapRow: Int
        let mapColumn: Int
    }

    /// Repräsentative IFA-Flächen inkl. Hub 27, Sommergarten und City Cube.
    static let all: [Definition] = {
        var items: [Definition] = []
        var order = 0

        func add(
            _ name: String,
            code: String? = nil,
            area: String,
            row: Int,
            col: Int
        ) {
            items.append(
                Definition(
                    name: name,
                    shortCode: code ?? name.replacingOccurrences(of: "Halle ", with: ""),
                    area: area,
                    sortOrder: order,
                    mapRow: row,
                    mapColumn: col
                )
            )
            order += 1
        }

        // Reihe 0 – Eingang / City Cube
        add("City Cube", code: "CC", area: "City Cube", row: 0, col: 0)
        add("Sommergarten", code: "SG", area: "Outdoor", row: 0, col: 1)
        add("Hub 27", code: "H27", area: "Hub", row: 0, col: 2)

        // Reihe 1–2 – Hallen 1–6
        add("Halle 1.1", area: "Süd", row: 1, col: 0)
        add("Halle 1.2", area: "Süd", row: 1, col: 1)
        add("Halle 2.1", area: "Süd", row: 1, col: 2)
        add("Halle 2.2", area: "Süd", row: 1, col: 3)
        add("Halle 3.1", area: "Süd", row: 2, col: 0)
        add("Halle 3.2", area: "Süd", row: 2, col: 1)
        add("Halle 4.1", area: "Süd", row: 2, col: 2)
        add("Halle 4.2", area: "Süd", row: 2, col: 3)

        // Reihe 3–4 – Hallen 5–8
        add("Halle 5.1", area: "Mitte", row: 3, col: 0)
        add("Halle 5.2", area: "Mitte", row: 3, col: 1)
        add("Halle 5.3", area: "Mitte", row: 3, col: 2)
        add("Halle 6.1", area: "Mitte", row: 3, col: 3)
        add("Halle 6.2", area: "Mitte", row: 4, col: 0)
        add("Halle 6.3", area: "Mitte", row: 4, col: 1)
        add("Halle 7.1a", area: "Mitte", row: 4, col: 2)
        add("Halle 7.1b", area: "Mitte", row: 4, col: 3)
        add("Halle 7.2a", area: "Mitte", row: 5, col: 0)
        add("Halle 7.2b", area: "Mitte", row: 5, col: 1)
        add("Halle 8.1", area: "Mitte", row: 5, col: 2)
        add("Halle 8.2", area: "Mitte", row: 5, col: 3)

        // Reihe 6–7 – Hallen 9–15
        add("Halle 9", area: "Nord", row: 6, col: 0)
        add("Halle 10.1", area: "Nord", row: 6, col: 1)
        add("Halle 10.2", area: "Nord", row: 6, col: 2)
        add("Halle 11.1", area: "Nord", row: 6, col: 3)
        add("Halle 11.2", area: "Nord", row: 7, col: 0)
        add("Halle 12", area: "Nord", row: 7, col: 1)
        add("Halle 13", area: "Nord", row: 7, col: 2)
        add("Halle 14", area: "Nord", row: 7, col: 3)
        add("Halle 15.1", area: "Nord", row: 8, col: 0)
        add("Halle 15.2", area: "Nord", row: 8, col: 1)

        // Reihe 8–9 – Hallen 16–22
        add("Halle 16", area: "Ost", row: 8, col: 2)
        add("Halle 17", area: "Ost", row: 8, col: 3)
        add("Halle 18", area: "Ost", row: 9, col: 0)
        add("Halle 19", area: "Ost", row: 9, col: 1)
        add("Halle 20", area: "Ost", row: 9, col: 2)
        add("Halle 21", area: "Ost", row: 9, col: 3)
        add("Halle 22", area: "Ost", row: 10, col: 0)

        // Reihe 10–11 – Hallen 23–27
        add("Halle 23", area: "West", row: 10, col: 1)
        add("Halle 24", area: "West", row: 10, col: 2)
        add("Halle 25", area: "West", row: 10, col: 3)
        add("Halle 26", area: "West", row: 11, col: 0)
        add("Halle 27", area: "West", row: 11, col: 1)

        return items
    }()
}
