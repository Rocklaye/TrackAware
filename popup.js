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

  /* ---------------------------------------------------------
     0) Tracking : ouverture / fermeture de l'extension
  --------------------------------------------------------- */
  chrome.runtime.sendMessage({
    type: "EXTENSION_OPEN",
    from: "popup"
  });

  window.addEventListener("unload", () => {
    chrome.runtime.sendMessage({
      type: "EXTENSION_CLOSE",
      from: "popup"
    });
  });

  /* ---------------------------------------------------------
     1) Charger les notes au démarrage
  --------------------------------------------------------- */
  loadNotes();

  /* ---------------------------------------------------------
     2) Ajouter une note
  --------------------------------------------------------- */
  addNoteBtn.addEventListener("click", () => {
    editingNoteId = null;
    noteTitle.value = "";
    noteContent.value = "";
    showEditor();
  });

  /* ---------------------------------------------------------
     3) Retour à la liste
  --------------------------------------------------------- */
  backBtn.addEventListener("click", () => {
    showMain();
  });

  /* ---------------------------------------------------------
     4) Enregistrer une note
  --------------------------------------------------------- */
  saveNoteBtn.addEventListener("click", () => {
    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title && !content) return;

    chrome.storage.local.get(["notes"], (result) => {
      let notes = result.notes || [];
      let noteId = editingNoteId;

      if (editingNoteId) {
        notes = notes.map(n =>
          n.id === editingNoteId ? { ...n, title, content } : n
        );
      } else {
        noteId = crypto.randomUUID();
        notes.push({
          id: noteId,
          title,
          content,
          createdAt: new Date().toISOString()
        });
      }

      chrome.storage.local.set({ notes }, () => {
        chrome.runtime.sendMessage({
          type: "NOTE_ADD",
          note_id: noteId,
          length: content.length,
          from: "popup"
        });

        loadNotes();
        showMain();
      });
    });
  });

  /* ---------------------------------------------------------
     5) Supprimer une note
  --------------------------------------------------------- */
  deleteNoteBtn.addEventListener("click", () => {
    if (!editingNoteId) return;

    chrome.storage.local.get(["notes"], (result) => {
      const notes = result.notes || [];
      const updated = notes.filter(n => n.id !== editingNoteId);

      chrome.storage.local.set({ notes: updated }, () => {
        chrome.runtime.sendMessage({
          type: "NOTE_DELETE",
          note_id: editingNoteId,
          from: "popup"
        });

        loadNotes();
        showMain();
      });
    });
  });

  /* ---------------------------------------------------------
     6) Recherche
  --------------------------------------------------------- */
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

  /* ---------------------------------------------------------
     7) Affichage des notes
  --------------------------------------------------------- */
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

      card.appendChild(title);

      card.addEventListener("click", () => {
        editingNoteId = note.id;
        noteTitle.value = note.title;
        noteContent.value = note.content;
        showEditor();
      });

      notesContainer.appendChild(card);
    });
  }

  /* ---------------------------------------------------------
     8) Gestion des vues
  --------------------------------------------------------- */
  function showEditor() {
    mainView.classList.add("hidden");
    editorView.classList.remove("hidden");

    deleteNoteBtn.classList.toggle("hidden", !editingNoteId);
  }

  function showMain() {
    editorView.classList.add("hidden");
    mainView.classList.remove("hidden");
  }

  /* ---------------------------------------------------------
     9) Bouton Confidentialité 
  --------------------------------------------------------- */
  const privacyBtn = document.getElementById("privacyBtn");
  if (privacyBtn) {
    privacyBtn.addEventListener("click", () => {
      chrome.tabs.create({ url: "consent.html" });
    });
  }
});
