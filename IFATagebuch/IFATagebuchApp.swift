import SwiftUI
import SwiftData

@main
struct IFATagebuchApp: App {
    private let container: ModelContainer

    init() {
        do {
            let schema = Schema([Hall.self, VisitEvent.self])
            let config = ModelConfiguration(
                "IFATagebuch",
                schema: schema,
                isStoredInMemoryOnly: false
            )
            container = try ModelContainer(for: schema, configurations: [config])
            try HallBootstrap.seedIfNeeded(context: ModelContext(container))
        } catch {
            fatalError("SwiftData konnte nicht gestartet werden: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootTabView()
                .preferredColorScheme(nil) // System / Dark Mode
        }
        .modelContainer(container)
    }
}
