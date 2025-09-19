(function () {
	const STORAGE_KEY = "si_tablet.notes.v1";

	function loadNotes() {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
		} catch {
			return [];
		}
	}

	function saveNotes(list) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
		} catch {}
	}

	function NoteItemHTML(note, idx) {
		return `
			<div class="note" data-i="${idx}">
				<div class="note-head">
					<span class="note-date">${new Date(note.ts).toLocaleString()}</span>
					<div class="note-actions">
						<button class="btn small" data-act="edit"	title="Editar">✎</button>
						<button class="btn small" data-act="delete" title="Eliminar">🗑</button>
					</div>
				</div>
				<div class="note-text">${escapeHtml(note.text)}</div>
			</div>
		`;
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;");
	}

	function mount(root, sdk) {
		let notes = loadNotes();

		root.innerHTML = `
			<div class="notes-wrap">
				<div class="notes-toolbar">
					<h2 class="title">Notas</h2>
					<div class="actions">
						<input class="input" type="text" placeholder="Escribe una nota y pulsa +">
						<button class="btn primary" data-act="add">+</button>
						<button class="btn" data-act="clear" title="Borrar todo">Limpiar</button>
						<button class="btn" data-act="close" title="Cerrar">✕</button>
					</div>
				</div>
				<div class="notes-list"></div>
				<div class="empty" hidden>No hay notas todavía.</div>
			</div>
		`;

		const els = {
			list: root.querySelector(".notes-list"),
			empty: root.querySelector(".empty"),
			input: root.querySelector(".input"),
			add: root.querySelector('[data-act="add"]'),
			clear: root.querySelector('[data-act="clear"]'),
			close: root.querySelector('[data-act="close"]'),
		};

		function render() {
			const prevScroll = els.list.scrollTop;

			if (!notes.length) {
				els.empty.hidden = false;
				els.empty.setAttribute('aria-hidden', 'false');
				if (els.list.innerHTML !== '') els.list.innerHTML = '';
			} else {
				els.empty.hidden = true;
				els.empty.setAttribute('aria-hidden', 'true');
				const html = notes.map(NoteItemHTML).join("");
				if (els.list.innerHTML !== html) {
					els.list.innerHTML = html;
					els.list.scrollTop = prevScroll;
				}
			}
			try {saveNotes(notes); } catch (e){console.error(e);}
		}

		function addNoteFromInput() {
			const val = (els.input.value || "").trim();
			if (!val) return;
			notes.unshift({ text: val, ts: Date.now() });
			els.input.value = "";
			render();
		}

		const onAdd = () => addNoteFromInput();
		const onKey = (e) => {
			if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNoteFromInput();
		};
		const onClear = () => {
		if (notes.length && confirm("¿Eliminar todas las notas?")) {
			notes = [];
			render();
		}
		};
		const onClose = () => sdk?.close && sdk.close();

		const onListClick = (e) => {
			const btn = e.target.closest("button[data-act]");
			const noteEl = e.target.closest(".note");
			if (!btn || !noteEl) return;
			const idx = Number(noteEl.getAttribute("data-i"));
			const act = btn.getAttribute("data-act");
			if (act === "delete") {
				notes.splice(idx, 1);
				render();
			} else if (act === "edit") {
				const cur = notes[idx].text;
				const next = prompt("Editar nota:", cur);
				if (next !== null) {
					notes[idx].text = next;
					render();
				}
			}
		};

		els.add.addEventListener("click", onAdd);
		els.input.addEventListener("keydown", onKey);
		els.clear.addEventListener("click", onClear);
		els.close.addEventListener("click", onClose);
		els.list.addEventListener("click", onListClick);

		render();

		return function unmount() {
			els.add.removeEventListener("click", onAdd);
			els.input.removeEventListener("keydown", onKey);
			els.clear.removeEventListener("click", onClear);
			els.close.removeEventListener("click", onClose);
			els.list.removeEventListener("click", onListClick);
		};
	}

	console.log("Notes app loaded");
	window.__si_register_app("notes", { mount });
})();
