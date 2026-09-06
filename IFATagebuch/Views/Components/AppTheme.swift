import SwiftUI

enum AppTheme {
    static let visited = Color.teal
    static let visitedSecondary = Color.cyan
    static let unvisited = Color.secondary.opacity(0.35)
    static let mapBackground = Color(.systemGroupedBackground)

    static func hallFill(isVisited: Bool) -> Color {
        isVisited ? visited.opacity(0.85) : Color(.secondarySystemFill)
    }

    static func hallStroke(isVisited: Bool) -> Color {
        isVisited ? visited : Color(.tertiaryLabel)
    }
}

extension Date {
    var shortTime: String {
        formatted(date: .omitted, time: .shortened)
    }

    var shortDateTime: String {
        formatted(date: .abbreviated, time: .shortened)
    }

    var timelineDay: String {
        formatted(.dateTime.weekday(.wide).day().month(.wide))
    }
}
