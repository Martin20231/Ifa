import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class HallListViewModel {
    private var modelContext: ModelContext?

    var searchText: String = ""
    var filterVisitedOnly: Bool = false
    var layoutMode: LayoutMode = .list

    enum LayoutMode: String, CaseIterable, Identifiable {
        case list
        case grid

        var id: String { rawValue }

        var title: String {
            switch self {
            case .list: return "Liste"
            case .grid: return "Grundriss"
            }
        }

        var systemImage: String {
            switch self {
            case .list: return "list.bullet"
            case .grid: return "square.grid.3x3.fill"
            }
        }
    }

    func configure(context: ModelContext) {
        self.modelContext = context
        try? HallBootstrap.seedIfNeeded(context: context)
    }

    func filtered(_ halls: [Hall]) -> [Hall] {
        halls
            .filter { hall in
                if filterVisitedOnly && !hall.isVisited { return false }
                if searchText.isEmpty { return true }
                let q = searchText.lowercased()
                return hall.name.lowercased().contains(q)
                    || hall.shortCode.lowercased().contains(q)
                    || hall.area.lowercased().contains(q)
                    || hall.manufacturersRaw.lowercased().contains(q)
                    || hall.notes.lowercased().contains(q)
            }
            .sorted { $0.sortOrder < $1.sortOrder }
    }

    func toggleCheckIn(_ hall: Hall) {
        guard let context = modelContext else { return }
        if hall.isVisited {
            hall.isVisited = false
            hall.checkedInAt = nil
            context.insert(
                VisitEvent(hallID: hall.hallID, hallName: hall.name, kind: .checkOut)
            )
        } else {
            hall.isVisited = true
            hall.checkedInAt = .now
            context.insert(
                VisitEvent(hallID: hall.hallID, hallName: hall.name, kind: .checkIn)
            )
        }
        try? context.save()
    }

    func quickCheckIn(_ hall: Hall) {
        guard !hall.isVisited else { return }
        toggleCheckIn(hall)
    }
}
