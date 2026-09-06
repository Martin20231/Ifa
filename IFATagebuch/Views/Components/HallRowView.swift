import SwiftUI

struct HallRowView: View {
    let hall: Hall
    var showsCheckInButton: Bool = true
    let onCheckIn: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(AppTheme.hallFill(isVisited: hall.isVisited))
                    .frame(width: 52, height: 52)
                Text(hall.shortCode)
                    .font(.caption.weight(.bold))
                    .foregroundStyle(hall.isVisited ? .white : .primary)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
                    .padding(.horizontal, 4)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(hall.name)
                    .font(.body.weight(.semibold))
                    .foregroundStyle(.primary)
                HStack(spacing: 8) {
                    Text(hall.area)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    if let checkedInAt = hall.checkedInAt, hall.isVisited {
                        Text("· \(checkedInAt.shortTime)")
                            .font(.caption)
                            .foregroundStyle(AppTheme.visited)
                    }
                }
                if !hall.manufacturers.isEmpty {
                    Text(hall.manufacturers.prefix(3).joined(separator: ", "))
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 8)

            if showsCheckInButton {
                Button(action: onCheckIn) {
                    Image(systemName: hall.isVisited ? "checkmark.circle.fill" : "plus.circle.fill")
                        .font(.title2)
                        .foregroundStyle(hall.isVisited ? AppTheme.visited : Color.accentColor)
                        .symbolEffect(.bounce, value: hall.isVisited)
                }
                .buttonStyle(.borderless)
                .accessibilityLabel(hall.isVisited ? "Check-in rückgängig" : "Schnell-Check-in")
            }
        }
        .padding(.vertical, 4)
    }
}
