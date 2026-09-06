import Foundation
import SwiftData

/// Initialisiert den Hallenkatalog einmalig in SwiftData.
enum HallBootstrap {
    static func seedIfNeeded(context: ModelContext) throws {
        let descriptor = FetchDescriptor<Hall>()
        let existing = try context.fetch(descriptor)
        guard existing.isEmpty else { return }

        for def in HallSeed.all {
            let hall = Hall(
                name: def.name,
                shortCode: def.shortCode,
                area: def.area,
                sortOrder: def.sortOrder,
                mapRow: def.mapRow,
                mapColumn: def.mapColumn
            )
            context.insert(hall)
        }
        try context.save()
    }
}
