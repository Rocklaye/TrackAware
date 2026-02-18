document.addEventListener("DOMContentLoaded", () => {

  const mainView = document.getElementById("mainView");
  const editorView = document.getElementById("editorView");

  const addNoteBtn = document.getElementById("addNoteBtn");
  const saveNoteBtn = document.getElementById("saveNoteBtn");
  const deleteNoteBtn = document.getElementById("deleteNoteBtn");
  const backBtn = document.getElementById("backBtn");

  const notesContainer = document.getElementById("notesContainer");

  const noteTitle = document.getElementById("noteTitle");
  const noteContent = document.getElementById("noteContent");

  const searchInput = document.getElementById("searchInput");

  let editingNoteId = null;

  chrome.storage.local.get(["consent"], (res) => {

  // Si pas de consentement enregistré → ouvrir page consentement
  if (!res.consent) {
    window.location.href = "consent.html";
    return;
  }

  // Sinon, initialiser le tracker avec le consent existant
  Tracker.init(res.consent);
  
});

  loadNotes();

  // Ouvrir l'éditeur pour une nouvelle note
  addNoteBtn.addEventListener("click", () => {
    editingNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
    showEditor();
  });

  // Retour au menu
  backBtn.addEventListener("click", () => {
    showMain();
  });

  // Enregistrer une note
saveNoteBtn.addEventListener("click", () => {
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();

  if (!title && !content) return;

  chrome.storage.local.get(["notes"], (result) => {
    let notes = result.notes || [];

    const isNew = !editingNoteId;
    let newId = null;

    if (editingNoteId) {
      notes = notes.map(n =>
        n.id === editingNoteId ? { ...n, title, content } : n
      );
    } else {
      newId = crypto.randomUUID();
      notes.push({
        id: newId,
        title,
        content,
        createdAt: new Date().toISOString()
      });
    }

    chrome.storage.local.set({ notes }, () => {

      // 🔥 TRACKING (ajout uniquement si nouvelle note)
      if (isNew) {
        chrome.runtime.sendMessage(
          {
            type: "NOTE_ADD",
            note_id: newId,
            length: content.length,
            from: "ui_add"
          },
          () => {} // optionnel
        );
      }

      loadNotes();
      showMain();
    });
  });
});

  // Supprimer une note depuis l'éditeur
  deleteNoteBtn.addEventListener("click", () => {
    if (!editingNoteId) return;

    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      const updated = notes.filter(n => n.id !== editingNoteId);

      chrome.storage.local.set({ notes: updated }, () => {

 // 🔥 TRACKING (suppression)
      chrome.runtime.sendMessage({
        type: "NOTE_DELETE",
        note_id: editingNoteId,
        from: "ui_delete"
      });

        loadNotes();
        showMain();
      });
    });
  });

  // Recherche en temps réel
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();

    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      const filtered = notes.filter(n =>
        n.title.toLowerCase().includes(query)
      );

      displayNotes(filtered);
    });
  });

  // Charger les notes
  function loadNotes() {
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      displayNotes(notes);
    });
  }

  function displayNotes(notes) {
    notesContainer.innerHTML = "";

    notes.forEach(note => {
      const card = document.createElement("div");
      card.className = "note-card";

      const title = document.createElement("div");
      title.textContent = note.title || "(Sans titre)";
      title.className = "note-title";

      const deleteIcon = document.createElement("span");
      deleteIcon.textContent = "🗑️";
      deleteIcon.className = "delete-icon";

      deleteIcon.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteNote(note.id);
      });

      card.appendChild(title);
      card.appendChild(deleteIcon);

      card.addEventListener("click", () => {
        editingNoteId = note.id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        showEditor();
      });

      notesContainer.appendChild(card);
    });
  }

  function deleteNote(id) {
    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      const updated = notes.filter(n => n.id !== id);

      chrome.storage.local.set({ notes: updated }, () => {
  // 🔥 TRACKING (suppression depuis la liste)
      chrome.runtime.sendMessage({
        type: "NOTE_DELETE",
        note_id: id,
        from: "ui_delete_list"
      });

 loadNotes();
      });
    });
  }

  function showEditor() {
    mainView.classList.add("hidden");
    editorView.classList.remove("hidden");

    if (editingNoteId) {
      deleteNoteBtn.classList.remove("hidden");
    } else {
      deleteNoteBtn.classList.add("hidden");
    }
  }

  function showMain() {
    editorView.classList.add("hidden");
    mainView.classList.remove("hidden");
  }

// Gestion du bouton de modification du consentement
const consentBtn = document.getElementById("change-consent-btn");

if (consentBtn) {
  consentBtn.addEventListener("click", () => {
    window.location.href = "consent.html";
  });
}
});
