import SwiftUI
import SwiftData
import PhotosUI

struct HallDetailView: View {
    @Environment(\.modelContext) private var modelContext
    @Bindable var hall: Hall
    @State private var viewModel: HallDetailViewModel?

    var body: some View {
        Group {
            if let viewModel {
                HallDetailForm(hall: hall, viewModel: viewModel)
            } else {
                ProgressView("Lade…")
            }
        }
        .navigationTitle(hall.name)
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            if viewModel == nil {
                viewModel = HallDetailViewModel(hall: hall, modelContext: modelContext)
            }
        }
    }
}

private struct HallDetailForm: View {
    @Bindable var hall: Hall
    @Bindable var viewModel: HallDetailViewModel
    @FocusState private var focusedField: Field?

    private enum Field {
        case manufacturers
        case notes
    }

    var body: some View {
        Form {
            Section {
                HStack {
                    StatusBadge(isVisited: hall.isVisited)
                    Spacer()
                    if let checkedInAt = hall.checkedInAt, hall.isVisited {
                        Text(checkedInAt.shortDateTime)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                if hall.isVisited {
                    Button(role: .destructive) {
                        viewModel.resetVisit()
                    } label: {
                        Label("Check-in zurücksetzen", systemImage: "arrow.uturn.backward")
                    }
                } else {
                    Button {
                        viewModel.checkInIfNeeded()
                    } label: {
                        Label("Jetzt einchecken", systemImage: "checkmark.circle.fill")
                    }
                    .tint(AppTheme.visited)
                }
            } header: {
                Text("Status")
            }

            Section {
                TextField("Samsung, Sony, LG…", text: $viewModel.manufacturerText, axis: .vertical)
                    .lineLimit(2...4)
                    .focused($focusedField, equals: .manufacturers)
            } header: {
                Text("Besuchte Stände / Hersteller")
            } footer: {
                Text("Mehrere Einträge mit Komma trennen.")
            }

            Section {
                TextField("Was war interessant?", text: $viewModel.notesText, axis: .vertical)
                    .lineLimit(4...10)
                    .focused($focusedField, equals: .notes)
            } header: {
                Text("Notizen")
            }

            Section {
                PhotosPicker(
                    selection: $viewModel.selectedPhotoItems,
                    maxSelectionCount: 8,
                    matching: .images,
                    photoLibrary: .shared()
                ) {
                    Label("Fotos hinzufügen", systemImage: "photo.on.rectangle.angled")
                }
                .onChange(of: viewModel.selectedPhotoItems) { _, _ in
                    Task { await viewModel.processSelectedPhotos() }
                }

                if viewModel.isSavingPhotos {
                    ProgressView("Speichere Fotos…")
                }

                if hall.photoFileNames.isEmpty {
                    Text("Noch keine Fotos")
                        .foregroundStyle(.secondary)
                } else {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(hall.photoFileNames, id: \.self) { name in
                                photoThumb(name: name)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
            } header: {
                Text("Fotos")
            } footer: {
                Text("Fotos bleiben nur lokal auf diesem Gerät.")
            }

            if let error = viewModel.errorMessage {
                Section {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.footnote)
                }
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                Button("Fertig") {
                    focusedField = nil
                    viewModel.saveTextFields()
                }
            }
            ToolbarItem(placement: .topBarTrailing) {
                Button("Sichern") {
                    focusedField = nil
                    viewModel.saveTextFields()
                    if !hall.isVisited {
                        viewModel.checkInIfNeeded()
                    }
                }
                .fontWeight(.semibold)
            }
        }
        .onDisappear {
            viewModel.saveTextFields()
        }
    }

    private func photoThumb(name: String) -> some View {
        ZStack(alignment: .topTrailing) {
            Group {
                if let image = PhotoStorage.loadImage(named: name) {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color(.tertiarySystemFill)
                        .overlay {
                            Image(systemName: "photo")
                                .foregroundStyle(.secondary)
                        }
                }
            }
            .frame(width: 96, height: 96)
            .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))

            Button {
                viewModel.removePhoto(named: name)
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .symbolRenderingMode(.palette)
                    .foregroundStyle(.white, .black.opacity(0.65))
            }
            .offset(x: 4, y: -4)
            .accessibilityLabel("Foto löschen")
        }
    }
}
