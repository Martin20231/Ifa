import Foundation
import CoreTransferable
import UniformTypeIdentifiers

/// Transferable-Wrapper für zuverlässigen Import aus PhotosPicker.
struct PickedImageData: Transferable {
    let data: Data

    static var transferRepresentation: some TransferRepresentation {
        DataRepresentation(importedContentType: .image) { data in
            PickedImageData(data: data)
        }
        DataRepresentation(importedContentType: .jpeg) { data in
            PickedImageData(data: data)
        }
        DataRepresentation(importedContentType: .png) { data in
            PickedImageData(data: data)
        }
        DataRepresentation(importedContentType: .heic) { data in
            PickedImageData(data: data)
        }
    }
}
