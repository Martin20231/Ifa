import Foundation
import SwiftData

/// Eine IFA-Halle inkl. Check-in-Status, Notizen und lokalen Foto-Referenzen.
@Model
final class Hall {
    @Attribute(.unique) var hallID: UUID
    var name: String
    var shortCode: String
    var area: String
    var sortOrder: Int
    var mapRow: Int
    var mapColumn: Int
    var isVisited: Bool
    var checkedInAt: Date?
    var notes: String
    /// Kommagetrennt gespeicherte Hersteller/Stände (einfach & SwiftData-freundlich).
    var manufacturersRaw: String
    /// Dateinamen relativ zum App-Documents/Photos-Ordner.
    var photoFileNames: [String]

    init(
        hallID: UUID = UUID(),
        name: String,
        shortCode: String,
        area: String,
        sortOrder: Int,
        mapRow: Int = 0,
        mapColumn: Int = 0,
        isVisited: Bool = false,
        checkedInAt: Date? = nil,
        notes: String = "",
        manufacturersRaw: String = "",
        photoFileNames: [String] = []
    ) {
        self.hallID = hallID
        self.name = name
        self.shortCode = shortCode
        self.area = area
        self.sortOrder = sortOrder
        self.mapRow = mapRow
        self.mapColumn = mapColumn
        self.isVisited = isVisited
        self.checkedInAt = checkedInAt
        self.notes = notes
        self.manufacturersRaw = manufacturersRaw
        self.photoFileNames = photoFileNames
    }

    var manufacturers: [String] {
        get {
            manufacturersRaw
                .split(separator: ",")
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
        }
        set {
            manufacturersRaw = newValue
                .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
                .filter { !$0.isEmpty }
                .joined(separator: ", ")
        }
    }

    var displayTitle: String { name }

    var statusLabel: String {
        isVisited ? "Besucht" : "Nicht besucht"
    }
}
