import SwiftUI

/// Interaktiver farbiger „Grundriss“ als Hallen-Grid.
struct HallMapGridView: View {
    let halls: [Hall]
    let onCheckIn: (Hall) -> Void

    private let columns = Array(repeating: GridItem(.flexible(minimum: 64), spacing: 8), count: 4)

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            legend

            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(halls.sorted { $0.sortOrder < $1.sortOrder }) { hall in
                    NavigationLink(value: hall.hallID) {
                        cell(for: hall)
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button {
                            onCheckIn(hall)
                        } label: {
                            Label(
                                hall.isVisited ? "Check-in rückgängig" : "Check-in",
                                systemImage: hall.isVisited ? "arrow.uturn.backward" : "checkmark.circle"
                            )
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }

    private var legend: some View {
        HStack(spacing: 16) {
            legendItem(color: AppTheme.visited, text: "Besucht")
            legendItem(color: Color(.secondarySystemFill), text: "Offen")
            Spacer()
            Text("Tipp: Lange drücken = Check-in")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func legendItem(color: Color, text: String) -> some View {
        HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 3)
                .fill(color)
                .frame(width: 12, height: 12)
            Text(text)
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
    }

    private func cell(for hall: Hall) -> some View {
        VStack(spacing: 4) {
            Text(hall.shortCode)
                .font(.caption.weight(.bold))
                .foregroundStyle(hall.isVisited ? .white : .primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            if hall.isVisited, let time = hall.checkedInAt {
                Text(time.shortTime)
                    .font(.system(size: 9, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.9))
            } else {
                Text(hall.area)
                    .font(.system(size: 9))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .frame(maxWidth: .infinity, minHeight: 64)
        .padding(6)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(AppTheme.hallFill(isVisited: hall.isVisited))
                .shadow(
                    color: hall.isVisited ? AppTheme.visited.opacity(0.45) : .clear,
                    radius: hall.isVisited ? 6 : 0,
                    y: 2
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(AppTheme.hallStroke(isVisited: hall.isVisited), lineWidth: hall.isVisited ? 1.5 : 0.5)
        )
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(hall.name), \(hall.statusLabel)")
    }
}
