import SwiftUI
import SwiftData

struct RootTabView: View {
    var body: some View {
        TabView {
            HallListView()
                .tabItem {
                    Label("Hallen", systemImage: "building.2.fill")
                }

            StatsView()
                .tabItem {
                    Label("Verlauf", systemImage: "chart.bar.fill")
                }
        }
        .tint(AppTheme.visited)
    }
}

#Preview {
    RootTabView()
        .modelContainer(for: [Hall.self, VisitEvent.self], inMemory: true)
}
