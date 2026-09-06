import Foundation
import SwiftData

/// Chronologischer Verlaufseintrag (Check-in / Check-out).
@Model
final class VisitEvent {
    @Attribute(.unique) var eventID: UUID
    var hallID: UUID
    var hallName: String
    var timestamp: Date
    var kindRaw: String

    init(
        eventID: UUID = UUID(),
        hallID: UUID,
        hallName: String,
        timestamp: Date = .now,
        kind: Kind = .checkIn
    ) {
        self.eventID = eventID
        self.hallID = hallID
        self.hallName = hallName
        self.timestamp = timestamp
        self.kindRaw = kind.rawValue
    }

    enum Kind: String, Codable, CaseIterable {
        case checkIn
        case checkOut
        case noteUpdate

        var title: String {
            switch self {
            case .checkIn: return "Check-in"
            case .checkOut: return "Zurückgesetzt"
            case .noteUpdate: return "Notiz aktualisiert"
            }
        }

        var systemImage: String {
            switch self {
            case .checkIn: return "checkmark.circle.fill"
            case .checkOut: return "arrow.uturn.backward.circle"
            case .noteUpdate: return "note.text"
            }
        }
    }

    var kind: Kind {
        get { Kind(rawValue: kindRaw) ?? .checkIn }
        set { kindRaw = newValue.rawValue }
    }
}
