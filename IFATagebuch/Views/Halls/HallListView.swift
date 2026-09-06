import SwiftUI
import SwiftData

struct HallListView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Hall.sortOrder) private var halls: [Hall]
    @State private var viewModel = HallListViewModel()

    var body: some View {
        NavigationStack {
            Group {
                if viewModel.layoutMode == .list {
                    listContent
                } else {
                    mapContent
                }
            }
            .navigationTitle("IFA Hallen")
            .navigationDestination(for: UUID.self) { hallID in
                if let hall = halls.first(where: { $0.hallID == hallID }) {
                    HallDetailView(hall: hall)
                } else {
                    ContentUnavailableView("Halle nicht gefunden", systemImage: "building.2")
                }
            }
            .searchable(text: $viewModel.searchText, prompt: "Halle, Hersteller, Notiz…")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Toggle(isOn: $viewModel.filterVisitedOnly) {
                        Image(systemName: "checkmark.seal")
                    }
                    .toggleStyle(.button)
                    .accessibilityLabel("Nur besuchte Hallen")
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Picker("Ansicht", selection: $viewModel.layoutMode) {
                        ForEach(HallListViewModel.LayoutMode.allCases) { mode in
                            Image(systemName: mode.systemImage)
                                .tag(mode)
                                .accessibilityLabel(mode.title)
                        }
                    }
                    .pickerStyle(.segmented)
                    .frame(maxWidth: 120)
                }
            }
            .safeAreaInset(edge: .top) {
                ProgressHeader(
                    visited: halls.filter(\.isVisited).count,
                    total: halls.count
                )
                .padding(.horizontal)
                .padding(.top, 4)
            }
        }
        .onAppear {
            viewModel.configure(context: modelContext)
        }
    }

    private var filteredHalls: [Hall] {
        viewModel.filtered(halls)
    }

    private var listContent: some View {
        List {
            ForEach(groupedByArea, id: \.area) { group in
                Section(group.area) {
                    ForEach(group.halls) { hall in
                        HStack(spacing: 0) {
                            NavigationLink(value: hall.hallID) {
                                HallRowView(hall: hall, showsCheckInButton: false, onCheckIn: {})
                            }

                            Button {
                                viewModel.toggleCheckIn(hall)
                            } label: {
                                Image(systemName: hall.isVisited ? "checkmark.circle.fill" : "plus.circle.fill")
                                    .font(.title2)
                                    .foregroundStyle(hall.isVisited ? AppTheme.visited : Color.accentColor)
                                    .frame(width: 44, height: 44)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.borderless)
                            .accessibilityLabel(hall.isVisited ? "Check-in rückgängig" : "Schnell-Check-in")
                        }
                    }
                }
            }
        }
        .listStyle(.insetGrouped)
    }

    private var mapContent: some View {
        ScrollView {
            HallMapGridView(
                halls: filteredHalls,
                onCheckIn: { viewModel.toggleCheckIn($0) }
            )
            .padding()
        }
        .background(AppTheme.mapBackground)
    }

    private var groupedByArea: [(area: String, halls: [Hall])] {
        let filtered = filteredHalls
        let areas = Array(Set(filtered.map(\.area))).sorted { lhs, rhs in
            let order = ["City Cube", "Outdoor", "Hub", "Süd", "Mitte", "Nord", "Ost", "West"]
            let li = order.firstIndex(of: lhs) ?? 99
            let ri = order.firstIndex(of: rhs) ?? 99
            if li == ri { return lhs < rhs }
            return li < ri
        }
        return areas.map { area in
            (area, filtered.filter { $0.area == area })
        }
    }
}
