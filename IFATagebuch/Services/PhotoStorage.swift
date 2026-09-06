import Foundation
import UIKit

/// Speichert ausgewählte Fotos lokal im Documents-Verzeichnis der App.
enum PhotoStorage {
    private static let folderName = "HallPhotos"

    static var photosDirectory: URL {
        let docs = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dir = docs.appendingPathComponent(folderName, isDirectory: true)
        if !FileManager.default.fileExists(atPath: dir.path) {
            try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        }
        return dir
    }

    static func url(for fileName: String) -> URL {
        photosDirectory.appendingPathComponent(fileName)
    }

    @discardableResult
    static func saveJPEG(_ data: Data, preferredName: String? = nil) throws -> String {
        let name = preferredName ?? "\(UUID().uuidString).jpg"
        let url = url(for: name)
        try data.write(to: url, options: .atomic)
        return name
    }

    static func loadImage(named fileName: String) -> UIImage? {
        let path = url(for: fileName).path
        return UIImage(contentsOfFile: path)
    }

    static func delete(named fileName: String) {
        let url = url(for: fileName)
        try? FileManager.default.removeItem(at: url)
    }

    static func deleteAll(named fileNames: [String]) {
        fileNames.forEach { delete(named: $0) }
    }
}
