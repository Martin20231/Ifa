import Foundation
import SwiftData
import SwiftUI
import PhotosUI
import Observation
import UIKit

@Observable
@MainActor
final class HallDetailViewModel {
    var hall: Hall
    var manufacturerText: String
    var notesText: String
    var selectedPhotoItems: [PhotosPickerItem] = []
    var isSavingPhotos = false
    var errorMessage: String?

    private let modelContext: ModelContext

    init(hall: Hall, modelContext: ModelContext) {
        self.hall = hall
        self.modelContext = modelContext
        self.manufacturerText = hall.manufacturers.joined(separator: ", ")
        self.notesText = hall.notes
    }

    func saveTextFields() {
        let previousNotes = hall.notes
        hall.manufacturers = manufacturerText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        hall.notes = notesText.trimmingCharacters(in: .whitespacesAndNewlines)

        if hall.notes != previousNotes, !hall.notes.isEmpty {
            modelContext.insert(
                VisitEvent(hallID: hall.hallID, hallName: hall.name, kind: .noteUpdate)
            )
        }
        try? modelContext.save()
    }

    func checkInIfNeeded() {
        guard !hall.isVisited else { return }
        hall.isVisited = true
        hall.checkedInAt = .now
        modelContext.insert(
            VisitEvent(hallID: hall.hallID, hallName: hall.name, kind: .checkIn)
        )
        try? modelContext.save()
    }

    func resetVisit() {
        hall.isVisited = false
        hall.checkedInAt = nil
        modelContext.insert(
            VisitEvent(hallID: hall.hallID, hallName: hall.name, kind: .checkOut)
        )
        try? modelContext.save()
    }

    func processSelectedPhotos() async {
        guard !selectedPhotoItems.isEmpty else { return }
        isSavingPhotos = true
        defer {
            isSavingPhotos = false
            selectedPhotoItems = []
        }

        do {
            var names = hall.photoFileNames
            for item in selectedPhotoItems {
                if let picked = try await item.loadTransferable(type: PickedImageData.self) {
                    let compressed = compressJPEG(picked.data) ?? picked.data
                    let fileName = try PhotoStorage.saveJPEG(compressed)
                    names.append(fileName)
                }
            }
            hall.photoFileNames = names
            try modelContext.save()
        } catch {
            errorMessage = "Foto konnte nicht gespeichert werden: \(error.localizedDescription)"
        }
    }

    func removePhoto(named fileName: String) {
        PhotoStorage.delete(named: fileName)
        hall.photoFileNames.removeAll { $0 == fileName }
        try? modelContext.save()
    }

    private func compressJPEG(_ data: Data, maxDimension: CGFloat = 1600, quality: CGFloat = 0.72) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let size = image.size
        let scale = min(1, maxDimension / max(size.width, size.height))
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        let renderer = UIGraphicsImageRenderer(size: target)
        let resized = renderer.image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: quality)
    }
}
