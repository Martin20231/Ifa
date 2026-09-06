import SwiftUI
import SwiftData

struct StatsView: View {
    @Query(sort: \Hall.sortOrder) private var halls: [Hall]
    @Query(sort: \VisitEvent.timestamp, order: .reverse) private var events: [VisitEvent]
    @State private var viewModel = StatsViewModel()

    var body: some View {
        NavigationStack {
            List {
                progressSection
                timelineSection
                manufacturersSection
                notesSection
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Wo war ich?")
            .searchable(text: $viewModel.searchText, prompt: "Notizen & Hersteller suchen…")
            .navigationDestination(for: UUID.self) { hallID in
                if let hall = halls.first(where: { $0.hallID == hallID }) {
                    HallDetailView(hall: hall)
                } else {
                    ContentUnavailableView("Halle nicht gefunden", systemImage: "building.2")
                }
            }
        }
    }

    private var progress: StatsViewModel.ProgressInfo {
        viewModel.progress(for: halls)
    }

    private var progressSection: some View {
        Section {
            VStack(alignment: .leading, spacing: 12) {
                Text(progress.label)
                    .font(.headline)

                ProgressView(value: progress.percent)
                    .tint(AppTheme.visited)
                    .scaleEffect(x: 1, y: 1.4, anchor: .center)

                HStack {
                    Label("\(progress.visited) besucht", systemImage: "checkmark.circle.fill")
                        .foregroundStyle(AppTheme.visited)
                    Spacer()
                    Label("\(progress.total - progress.visited) offen", systemImage: "circle")
                        .foregroundStyle(.secondary)
                }
                .font(.caption.weight(.medium))
            }
            .padding(.vertical, 6)
        } header: {
            Text("Fortschritt")
        }
    }

    private var timelineSection: some View {
        Section {
            let timeline = viewModel.timeline(events: events)
            if timeline.isEmpty {
                Text("Noch keine Besuche – Check-ins erscheinen hier chronologisch.")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
                    .padding(.vertical, 8)
            } else {
                ForEach(timeline) { event in
                    NavigationLink(value: event.hallID) {
                        HStack(spacing: 12) {
                            Image(systemName: event.kind.systemImage)
                                .foregroundStyle(event.kind == .checkIn ? AppTheme.visited : .secondary)
                                .frame(width: 28)

                            VStack(alignment: .leading, spacing: 2) {
                                Text(event.hallName)
                                    .font(.body.weight(.semibold))
                                Text(event.kind.title)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Text(event.timestamp.shortDateTime)
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        } header: {
            Text("Verlauf")
        }
    }

    private var manufacturersSection: some View {
        let makers = viewModel.manufacturerSummary(from: halls)
            .filter {
                viewModel.searchText.isEmpty
                    || $0.lowercased().contains(viewModel.searchText.lowercased())
            }

        return Section {
            if makers.isEmpty {
                Text("Noch keine Hersteller erfasst")
                    .foregroundStyle(.secondary)
            } else {
                FlexibleChipWrap(items: makers)
                    .padding(.vertical, 4)
            }
        } header: {
            Text("Hersteller (\(makers.count))")
        }
    }

    private var notesSection: some View {
        Section {
            let rows = viewModel.noteRows(from: halls)
            if rows.isEmpty {
                Text("Keine Notizen vorhanden")
                    .foregroundStyle(.secondary)
            } else {
                ForEach(rows) { row in
                    NavigationLink(value: row.id) {
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                Text(row.hallName)
                                    .font(.subheadline.weight(.semibold))
                                Spacer()
                                if let date = row.checkedInAt {
                                    Text(date.shortDateTime)
                                        .font(.caption2)
                                        .foregroundStyle(.secondary)
                                }
                            }
                            if !row.manufacturers.isEmpty {
                                Text(row.manufacturers)
                                    .font(.caption.weight(.medium))
                                    .foregroundStyle(AppTheme.visited)
                            }
                            if !row.notes.isEmpty {
                                Text(row.notes)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(3)
                                    .multilineTextAlignment(.leading)
                            }
                        }
                        .padding(.vertical, 2)
                    }
                }
            }
        } header: {
            Text("Notizen & Stände")
        }
    }
}

/// Einfache Wrap-Chips ohne externe Abhängigkeit.
struct FlexibleChipWrap: View {
    let items: [String]

    var body: some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.self) { item in
                Text(item)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(
                        Capsule()
                            .fill(AppTheme.visited.opacity(0.18))
                    )
                    .foregroundStyle(AppTheme.visited)
            }
        }
    }
}

/// Minimaler Flow-Layout-Container (iOS 16+ Layout).
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        arrange(proposal: proposal, subviews: subviews).size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrange(proposal: proposal, subviews: subviews)
        for (index, frame) in result.frames.enumerated() {
            subviews[index].place(
                at: CGPoint(x: bounds.minX + frame.minX, y: bounds.minY + frame.minY),
                proposal: ProposedViewSize(frame.size)
            )
        }
    }

    private func arrange(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, frames: [CGRect]) {
        let maxWidth = proposal.width ?? .infinity
        var frames: [CGRect] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth, x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            frames.append(CGRect(origin: CGPoint(x: x, y: y), size: size))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), frames)
    }
}
