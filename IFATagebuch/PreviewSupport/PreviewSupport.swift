import SwiftUI
import SwiftData

enum PreviewSupport {
    @MainActor
    static func container(seedSampleData: Bool = true) -> ModelContainer {
        let schema = Schema([Hall.self, VisitEvent.self])
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try! ModelContainer(for: schema, configurations: [config])
        let context = ModelContext(container)
        try? HallBootstrap.seedIfNeeded(context: context)

        if seedSampleData {
            let halls = try? context.fetch(FetchDescriptor<Hall>(sortBy: [SortDescriptor(\.sortOrder)]))
            if let first = halls?.first {
                first.isVisited = true
                first.checkedInAt = .now.addingTimeInterval(-3600)
                first.manufacturers = ["Samsung", "Sony"]
                first.notes = "OLED-Demo beeindruckend – Preis notieren."
                context.insert(
                    VisitEvent(hallID: first.hallID, hallName: first.name, kind: .checkIn)
                )
            }
            if let second = halls?.dropFirst().first {
                second.isVisited = true
                second.checkedInAt = .now.addingTimeInterval(-1800)
                second.manufacturers = ["LG"]
                context.insert(
                    VisitEvent(hallID: second.hallID, hallName: second.name, kind: .checkIn)
                )
            }
            try? context.save()
        }

        return container
    }
}

#Preview("Hallen") {
    HallListView()
        .modelContainer(PreviewSupport.container())
}

#Preview("Verlauf") {
    StatsView()
        .modelContainer(PreviewSupport.container())
}
