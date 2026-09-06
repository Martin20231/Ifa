import SwiftUI

struct StatusBadge: View {
    let isVisited: Bool
    var compact: Bool = false

    var body: some View {
        Label(
            isVisited ? "Besucht" : "Nicht besucht",
            systemImage: isVisited ? "checkmark.circle.fill" : "circle"
        )
        .font(compact ? .caption2.weight(.semibold) : .caption.weight(.semibold))
        .padding(.horizontal, compact ? 6 : 8)
        .padding(.vertical, compact ? 3 : 4)
        .foregroundStyle(isVisited ? Color.white : Color.secondary)
        .background(
            Capsule()
                .fill(isVisited ? AppTheme.visited : Color(.tertiarySystemFill))
        )
        .accessibilityLabel(isVisited ? "Status: Besucht" : "Status: Nicht besucht")
    }
}

struct ProgressHeader: View {
    let visited: Int
    let total: Int

    private var percent: Double {
        guard total > 0 else { return 0 }
        return Double(visited) / Double(total)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Fortschritt")
                    .font(.subheadline.weight(.semibold))
                Spacer()
                Text("\(visited)/\(total)")
                    .font(.subheadline.monospacedDigit().weight(.bold))
                    .foregroundStyle(AppTheme.visited)
            }

            ProgressView(value: percent)
                .tint(AppTheme.visited)

            Text("\(Int((percent * 100).rounded()))% der Hallen besucht")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }
}
