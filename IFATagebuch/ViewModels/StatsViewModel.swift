import Foundation
import SwiftData
import Observation

@Observable
@MainActor
final class StatsViewModel {
    var searchText: String = ""

    struct ProgressInfo {
        let visited: Int
        let total: Int
        var percent: Double {
            guard total > 0 else { return 0 }
            return Double(visited) / Double(total)
        }
        var label: String {
            let pct = Int((percent * 100).rounded())
            return "\(visited) von \(total) Hallen besucht (\(pct)%)"
        }
    }

    struct NoteRow: Identifiable, Hashable {
        let id: UUID
        let hallName: String
        let manufacturers: String
        let notes: String
        let checkedInAt: Date?
    }

    func progress(for halls: [Hall]) -> ProgressInfo {
        ProgressInfo(
            visited: halls.filter(\.isVisited).count,
            total: halls.count
        )
    }

    func timeline(events: [VisitEvent]) -> [VisitEvent] {
        events.sorted { $0.timestamp > $1.timestamp }
    }

    func noteRows(from halls: [Hall]) -> [NoteRow] {
        halls
            .filter { !$0.notes.isEmpty || !$0.manufacturers.isEmpty }
            .sorted { ($0.checkedInAt ?? .distantPast) > ($1.checkedInAt ?? .distantPast) }
            .map {
                NoteRow(
                    id: $0.hallID,
                    hallName: $0.name,
                    manufacturers: $0.manufacturers.joined(separator: ", "),
                    notes: $0.notes,
                    checkedInAt: $0.checkedInAt
                )
            }
            .filter { row in
                guard !searchText.isEmpty else { return true }
                let q = searchText.lowercased()
                return row.hallName.lowercased().contains(q)
                    || row.manufacturers.lowercased().contains(q)
                    || row.notes.lowercased().contains(q)
            }
    }

    func manufacturerSummary(from halls: [Hall]) -> [String] {
        var set = Set<String>()
        for hall in halls {
            for m in hall.manufacturers {
                set.insert(m)
            }
        }
        return set.sorted { $0.localizedCaseInsensitiveCompare($1) == .orderedAscending }
    }
}
