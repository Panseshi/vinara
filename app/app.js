/* ─── Vinara Notes — Application Logic ─────────────────────────
 *  Note-taking app with transliteration for Vinara script.
 *  Open source under SIL OFL 1.1.
 * ───────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ── STATE ──
  var notes = JSON.parse(localStorage.getItem('vinara_notes') || '[]');
  var activeId = null;
  var searchQuery = '';
  var inputMode = localStorage.getItem('vinara_input_mode') || 'vinara';     // 'vinara' | 'latin'
  var latinSubMode = localStorage.getItem('vinara_latin_sub') || 'dhivehi';  // 'dhivehi' | 'english'
  var fontSize = localStorage.getItem('vinara_font_size') || '48';           // '32' | '48' | '72'

  // ── DOM refs (populated on DOMContentLoaded) ──
  var DOM = {};

  // ── UTILS ──
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  }
  function persist() { localStorage.setItem('vinara_notes', JSON.stringify(notes)); }
  function showToast(msg, duration) {
    if (!duration) duration = 1800;
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, duration);
  }
  function insertAtCursor(el, text) {
    var start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.substring(0, start) + text + el.value.substring(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  }

  // ── THEME ──
  function initTheme() {
    var saved = localStorage.getItem('vinara_theme');
    var isLight = saved === 'light';
    if (isLight) document.documentElement.classList.add('light');
    var icon = document.getElementById('themeIcon');
    var iconDark = document.getElementById('themeIconDark');
    if (icon && iconDark) {
      if (isLight) {
        icon.style.display = 'block';
        iconDark.style.display = 'none';
      } else {
        icon.style.display = 'none';
        iconDark.style.display = 'block';
      }
    }
  }
  function toggleTheme() {
    document.documentElement.classList.toggle('light');
    var isLight = document.documentElement.classList.contains('light');
    localStorage.setItem('vinara_theme', isLight ? 'light' : 'dark');
    var icon = document.getElementById('themeIcon');
    var iconDark = document.getElementById('themeIconDark');
    if (icon && iconDark) {
      if (isLight) {
        icon.style.display = 'block';
        iconDark.style.display = 'none';
      } else {
        icon.style.display = 'none';
        iconDark.style.display = 'block';
      }
    }
  }

  // ── SIDEBAR ──
  function renderSidebar() {
    var list = document.getElementById('notesList');
    var visible = notes;
    if (searchQuery) {
      var q = searchQuery.toLowerCase();
      visible = visible.filter(function(n) {
        return n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          (Array.isArray(n.tags) && n.tags.some(function(t) { return t.toLowerCase().includes(q); }));
      });
    }
    visible = [].concat(visible).sort(function(a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
    });
    if (visible.length === 0) {
      list.innerHTML = notes.length === 0
        ? '<div class="note-empty">No notes yet</div>'
        : '<div class="note-empty">No notes match</div>';
      return;
    }
    var hasPinned = visible.some(function(n) { return n.pinned; });
    var html = '';
    var pinnedRendered = false, regularRendered = false;
    visible.forEach(function(n) {
      var isPinned = n.pinned;
      if (isPinned && !pinnedRendered) { html += '<div class="pin-section-label">Pinned</div>'; pinnedRendered = true; }
      if (!isPinned && hasPinned && pinnedRendered && !regularRendered) { html += '<div class="pin-section-label">Notes</div>'; regularRendered = true; }
      if (!isPinned && !hasPinned && !regularRendered) { regularRendered = true; }
      var tagsHtml = Array.isArray(n.tags) && n.tags.length
        ? '<div class="note-tags">' + n.tags.map(function(t) { return '<span class="note-tag">' + t + '</span>'; }).join('') + '</div>'
        : '';
      html += '<div class="note-item ' + (n.id === activeId ? 'active' : '') + (isPinned ? ' pinned' : '') + '" data-id="' + n.id + '">';
      html += '<div class="note-item-title" onclick="openNote(\'' + n.id + '\')">' + (n.title || 'untitled');
      html += '<div class="note-actions">';
      html += '<div class="delete-indicator" onclick="event.stopPropagation(); deleteNoteById(\'' + n.id + '\')" title="Delete">';
      html += '<svg viewBox="0 0 24 24" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
      html += '</div>';
      html += '<div class="rename-indicator" onclick="event.stopPropagation(); renameNote(\'' + n.id + '\')" title="Rename">';
      html += '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
      html += '</div>';
      html += '<div class="pin-indicator" onclick="event.stopPropagation(); togglePin(\'' + n.id + '\')" title="' + (isPinned ? 'Unpin' : 'Pin') + '">';
      html += '<svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>';
      html += '</div></div></div>';
      html += '<div class="note-item-date">' + formatDate(n.updatedAt || n.createdAt) + '</div>';
      html += tagsHtml + '</div>';
    });
    list.innerHTML = html;
  }

  // ── NOTES CRUD ──
  function newNote() {
    var note = { id: uid(), title: 'untitled', content: '', createdAt: Date.now(), updatedAt: Date.now(), pinned: false, tags: [] };
    notes.push(note);
    persist();
    renderSidebar();
    openNote(note.id);
    var editor = document.getElementById('editor');
    if (editor) editor.focus();
  }

  function renameNote(id) {
    var note = notes.find(function(n) { return n.id === id; });
    if (!note) return;
    var newTitle = prompt('Rename note:', note.title || 'untitled');
    if (newTitle === null) return;
    newTitle = newTitle.trim();
    if (newTitle === '') newTitle = 'untitled';
    note.title = newTitle;
    note.updatedAt = Date.now();
    persist();
    renderSidebar();
    if (activeId === id) {
      var meta = document.getElementById('editorMeta');
      if (meta) meta.textContent = formatDate(note.updatedAt);
    }
  }

  function autoTitleFromContent(note) {
    if (!note.content || note.content.trim() === '') return;
    var lines = note.content.split(/\r?\n/);
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (line !== '') {
        note.title = line.substring(0, 30);
        break;
      }
    }
  }

  function openNote(id) {
    activeId = id;
    var note = notes.find(function(n) { return n.id === id; });
    if (!note) return;
    var noNote = document.getElementById('noNote');
    if (noNote) noNote.style.display = 'none';
    var editorView = document.getElementById('editorView');
    if (editorView) editorView.style.display = 'flex';
    var editor = document.getElementById('editor');
    if (editor) editor.value = note.content;

    if (inputMode === 'latin') {
      var latinEditor = document.getElementById('latinEditor');
      if (latinEditor) latinEditor.value = '';
      var preview = document.getElementById('vinaraPreviewContent');
      if (preview) preview.textContent = note.content || '';
    }

    var meta = document.getElementById('editorMeta');
    if (meta) meta.textContent = formatDate(note.updatedAt || note.createdAt);
    renderSidebar();
  }

  function deleteNoteById(id) {
    if (!confirm('Delete this note?')) return;
    notes = notes.filter(function(n) { return n.id !== id; });
    if (activeId === id) {
      activeId = null;
      var editor = document.getElementById('editor');
      if (editor) editor.value = '';
      var meta = document.getElementById('editorMeta');
      if (meta) meta.textContent = '';
      var noNote = document.getElementById('noNote');
      if (noNote) noNote.style.display = 'none';
      var editorView = document.getElementById('editorView');
      if (editorView) editorView.style.display = 'flex';
    }
    persist();
    renderSidebar();
  }

  function deleteNote() {
    deleteNoteById(activeId);
  }

  function togglePin(id) {
    var note = notes.find(function(n) { return n.id === id; });
    if (!note) return;
    note.pinned = !note.pinned;
    persist();
    renderSidebar();
  }

  function saveNoteAsVnr() {
    if (!activeId) return;
    var note = notes.find(function(n) { return n.id === activeId; });
    if (!note) return;
    var MAGIC = 'VNR1';
    var encoded = MAGIC + btoa(unescape(encodeURIComponent(note.content)));
    var blob = new Blob([encoded], { type: 'application/octet-stream' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = (note.title || 'note') + '.vnr';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
    showToast('Saved as .vnr');
  }

  function exportNoteAsPng() {
    if (!activeId) return;
    var note = notes.find(function(n) { return n.id === activeId; });
    if (!note || !note.content || note.content.trim() === '') {
      showToast('No content to export');
      return;
    }
    var target = document.getElementById('capture-target');
    if (!target) return;
    target.textContent = note.content;
    target.className = '';
    target.classList.add('font-' + (fontSize === '32' ? 'small' : fontSize === '48' ? 'medium' : 'large'));
    target.style.display = 'block';

    html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    }).then(function(canvas) {
      target.style.display = 'none';
      target.textContent = '';
      var link = document.createElement('a');
      link.download = (note.title || 'note') + '.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported as PNG');
    }).catch(function() {
      target.style.display = 'none';
      target.textContent = '';
      showToast('Export failed');
    });
  }

  // ── INPUT MODE TOGGLE ──
  function setInputMode(mode) {
    inputMode = mode;
    localStorage.setItem('vinara_input_mode', mode);

    document.querySelectorAll('.input-mode-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.input === mode);
    });

    var subGroup = document.getElementById('latinSubGroup');
    if (subGroup) subGroup.style.display = mode === 'latin' ? 'flex' : 'none';

    var editor = document.getElementById('editor');
    var latinView = document.getElementById('latinView');
    if (editor) editor.style.display = mode === 'vinara' ? 'block' : 'none';
    if (latinView) latinView.style.display = mode === 'latin' ? 'flex' : 'none';

    if (mode === 'latin' && activeId) {
      var note = notes.find(function(n) { return n.id === activeId; });
      if (note && note.content) {
        var preview = document.getElementById('vinaraPreviewContent');
        if (preview) preview.textContent = note.content;
      }
    }
  }

  function setLatinSubMode(mode) {
    latinSubMode = mode;
    localStorage.setItem('vinara_latin_sub', mode);
    document.querySelectorAll('.latin-sub-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.sub === mode);
    });
    updateLatinPreview();
  }

  // ── FONT SIZE ──
  function setFontSize(size) {
    fontSize = size;
    localStorage.setItem('vinara_font_size', size);

    document.querySelectorAll('.font-size-btn').forEach(function(b) {
      b.classList.toggle('active', b.dataset.size === size);
    });

    var sizeClass = 'font-' + (size === '32' ? 'small' : size === '48' ? 'medium' : 'large');

    var editor = document.getElementById('editor');
    if (editor) {
      editor.classList.remove('font-small', 'font-medium', 'font-large');
      editor.classList.add(sizeClass);
    }

    var preview = document.getElementById('vinaraPreviewContent');
    if (preview) {
      preview.classList.remove('font-small', 'font-medium', 'font-large');
      preview.classList.add(sizeClass);
    }
  }

  // ── LATIN PREVIEW ──
  function updateLatinPreview() {
    var latinEditor = document.getElementById('latinEditor');
    var preview = document.getElementById('vinaraPreviewContent');
    if (!latinEditor || !preview) return;
    var text = latinEditor.value;
    if (!text) {
      if (activeId) {
        var note = notes.find(function(n) { return n.id === activeId; });
        if (note && note.content) {
          preview.textContent = note.content;
          return;
        }
      }
      preview.innerHTML = '<span style="color:var(--text-dim);font-family:var(--font-ui);font-size:13px;">vinara output appears here…</span>';
      return;
    }
    var converted;
    if (latinSubMode === 'dhivehi') {
      converted = VinaraTranslit.dhivehiMode(text);
    } else {
      converted = VinaraTranslit.englishMode(text);
    }
    preview.textContent = converted;
  }

  function exportVinaraPreview() {
    var preview = document.getElementById('vinaraPreviewContent');
    if (!preview || !preview.textContent || preview.textContent.trim() === '') {
      showToast('No content to export');
      return;
    }
    var target = document.getElementById('capture-target');
    if (!target) return;
    target.textContent = preview.textContent;
    target.className = '';
    target.classList.add('font-' + (fontSize === '32' ? 'small' : fontSize === '48' ? 'medium' : 'large'));
    target.style.display = 'block';

    html2canvas(target, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    }).then(function(canvas) {
      target.style.display = 'none';
      target.textContent = '';
      var link = document.createElement('a');
      link.download = 'vinara-' + Date.now() + '.png';
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Image exported');
    }).catch(function() {
      target.style.display = 'none';
      target.textContent = '';
      showToast('Export failed');
    });
  }

  function sendToNote() {
    var preview = document.getElementById('vinaraPreviewContent');
    if (!preview || !preview.textContent || preview.textContent.trim() === '') {
      showToast('Nothing to send');
      return;
    }
    var vinaraText = preview.textContent;
    var editor = document.getElementById('editor');
    if (editor) {
      editor.value = vinaraText;
      var note = notes.find(function(n) { return n.id === activeId; });
      if (note) {
        note.content = vinaraText;
        note.updatedAt = Date.now();
        if (note.title === 'untitled' || note.title === 'Untitled') {
          autoTitleFromContent(note);
        }
        persist();
        renderSidebar();
      }
    }
    setInputMode('vinara');
    showToast('Sent to note');
  }

  // ── REFERENCE DRAWER ──
  function buildDrawer() {
    var body = document.getElementById('drawerBody');
    if (!body) return;

    var ref = [
      { group: 'Consonants', keys: [
        { latin: 'h',  vinara: 'h',  thaana: '\u0780', roman: 'h' },
        { latin: 'S',  vinara: 'S',  thaana: '\u0781', roman: 'sh' },
        { latin: 'n',  vinara: 'n',  thaana: '\u0782', roman: 'n' },
        { latin: 'r',  vinara: 'r',  thaana: '\u0783', roman: 'r' },
        { latin: 'b',  vinara: 'b',  thaana: '\u0784', roman: 'b' },
        { latin: 'L',  vinara: 'L',  thaana: '\u0785', roman: 'lh' },
        { latin: 'k',  vinara: 'k',  thaana: '\u0786', roman: 'k' },
        { latin: 'W',  vinara: 'W',  thaana: '\u0787', roman: 'alifu' },
        { latin: 'v',  vinara: 'v',  thaana: '\u0788', roman: 'v' },
        { latin: 'm',  vinara: 'm',  thaana: '\u0789', roman: 'm' },
        { latin: 'f',  vinara: 'f',  thaana: '\u078A', roman: 'f' },
        { latin: 'D',  vinara: 'D',  thaana: '\u078B', roman: 'dh' },
        { latin: 'T',  vinara: 'T',  thaana: '\u078C', roman: 'th' },
        { latin: 'l',  vinara: 'l',  thaana: '\u078D', roman: 'l' },
        { latin: 'g',  vinara: 'g',  thaana: '\u078E', roman: 'g' },
        { latin: 'N',  vinara: 'N',  thaana: '\u078F', roman: 'gn' },
        { latin: 's',  vinara: 's',  thaana: '\u0790', roman: 's' },
        { latin: 'd',  vinara: 'd',  thaana: '\u0791', roman: 'd' },
        { latin: 'z',  vinara: 'z',  thaana: '\u0792', roman: 'z' },
        { latin: 't',  vinara: 't',  thaana: '\u0793', roman: 't' },
        { latin: 'y',  vinara: 'y',  thaana: '\u0794', roman: 'y' },
        { latin: 'p',  vinara: 'p',  thaana: '\u0795', roman: 'p' },
        { latin: 'j',  vinara: 'j',  thaana: '\u0796', roman: 'j' },
        { latin: 'C',  vinara: 'C',  thaana: '\u0797', roman: 'ch' }
      ]},
      { group: 'English letters', keys: [
        { latin: 'w',  vinara: 'w',  thaana: '',     roman: 'w' },
        { latin: 'x',  vinara: 'x',  thaana: '',     roman: 'x' },
        { latin: 'c',  vinara: 'c',  thaana: '',     roman: 'c' },
        { latin: 'q',  vinara: 'q',  thaana: '',     roman: 'q' }
      ]},
      { group: 'Vowels', keys: [
        { latin: 'a',  vinara: 'a',  thaana: '\u07A6', roman: 'a' },
        { latin: 'i',  vinara: 'i',  thaana: '\u07A8', roman: 'i' },
        { latin: 'u',  vinara: 'u',  thaana: '\u07AA', roman: 'u' },
        { latin: 'e',  vinara: 'e',  thaana: '\u07AC', roman: 'e' },
        { latin: 'o',  vinara: 'o',  thaana: '\u07AE', roman: 'o' }
      ]},
      { group: 'Long vowels (Dhivehi)', keys: [
        { latin: 'aa', vinara: 'aX', thaana: '\u07A7', roman: 'aa' },
        { latin: 'ee', vinara: 'iX', thaana: '\u07A9', roman: 'ee' },
        { latin: 'oo', vinara: 'uX', thaana: '\u07AB', roman: 'oo' },
        { latin: 'ey', vinara: 'eX', thaana: '\u07AD', roman: 'ey' },
        { latin: 'oa', vinara: 'oX', thaana: '\u07AF', roman: 'oa' }
      ]},
      { group: 'Sukun', keys: [
        { latin: 'WQ', vinara: 'WQ', thaana: '\u0787\u07B0', roman: 'h (sukun)' },
        { latin: 'sQ', vinara: 'sQ', thaana: '\u0790\u07B0', roman: 's (sukun)' },
        { latin: 'nQ', vinara: 'nQ', thaana: '\u0782\u07B0', roman: 'n (sukun)' },
        { latin: 'TQ', vinara: 'TQ', thaana: '\u078C\u07B0', roman: 'th (sukun)' },
        { latin: 'SQ', vinara: 'SQ', thaana: '\u0781\u07B0', roman: 'sh (sukun)' }
      ]}
    ];

    var html = '';
    ref.forEach(function(group) {
      html += '<div class="ref-group-label">' + group.group + '</div>';
      html += '<div class="ref-grid">';
      group.keys.forEach(function(k) {
        html += '<div class="ref-key">';
        html += '<div class="ref-vinara">' + k.vinara + '</div>';
        html += '<div class="ref-thaana">' + (k.thaana || '') + '</div>';
        html += '<div class="ref-roman">' + k.roman + '</div>';
        html += '</div>';
      });
      html += '</div>';
    });
    body.innerHTML = html;
  }

  function openDrawer() {
    document.getElementById('drawer').classList.add('open');
    document.getElementById('drawerOverlay').classList.add('open');
  }
  function closeDrawer() {
    document.getElementById('drawer').classList.remove('open');
    document.getElementById('drawerOverlay').classList.remove('open');
  }

  // ── STATS ──
  function updateStats() {
    var t = '';
    if (inputMode === 'vinara') {
      var editor = document.getElementById('editor');
      if (editor) t = editor.value;
    } else {
      var preview = document.getElementById('vinaraPreviewContent');
      if (preview) t = preview.textContent || '';
    }
    var c = t.length;
    var w = t.trim() === '' ? 0 : t.trim().split(/\s+/).length;
    var charEl = document.getElementById('charCount');
    var wordEl = document.getElementById('wordCount');
    if (charEl) charEl.textContent = c + ' character' + (c !== 1 ? 's' : '');
    if (wordEl) wordEl.textContent = w + ' word' + (w !== 1 ? 's' : '');
  }

  function setSaveStatus(status) {
    var dot = document.querySelector('.save-dot');
    if (!dot) return;
    dot.className = 'save-dot' + (status ? ' ' + status : '');
  }

  function checkFont() {
    var dot = document.getElementById('fontDot');
    if (!dot) return;
    document.fonts.ready.then(function() {
      if (document.fonts.check('24px Vinara')) {
        dot.className = 'font-dot loaded';
        dot.title = 'Vinara font loaded';
      } else {
        dot.className = 'font-dot missing';
        dot.title = 'Vinara font not loaded';
      }
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    var panel = document.getElementById('panel-' + tabId);
    if (panel) panel.classList.add('active');
    var tabBtn = document.querySelector('.tab[data-tab="' + tabId + '"]');
    if (tabBtn) tabBtn.classList.add('active');
  }

  // ── EVENT WIRING ──
  function wireEvents() {
    var editor = document.getElementById('editor');
    if (editor) {
      // Auto-create a new note when user clicks in empty editor
      editor.addEventListener('focus', function() {
        if (!activeId) { newNote(); }
      });
      editor.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveNoteAsVnr(); setSaveStatus('saved'); persist(); showToast('Saved'); return; }
        if (e.ctrlKey && e.key === 'e') { e.preventDefault(); exportNoteAsPng(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (['Backspace','Delete','Tab','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown',
             'Home','End','PageUp','PageDown','Escape'].indexOf(e.key) >= 0) return;

        if (inputMode === 'vinara') {
          var upperVowelMap = { 'A': 'aX', 'E': 'eX', 'I': 'iX', 'O': 'oX', 'U': 'uX' };
          if (upperVowelMap[e.key]) {
            e.preventDefault();
            insertAtCursor(editor, upperVowelMap[e.key]);
            editor.dispatchEvent(new Event('input'));
          }
        }
      });
      editor.addEventListener('input', function() {
        if (!activeId || inputMode !== 'vinara') return;

        var val = editor.value;
        var cursor = editor.selectionStart;
        var changed = false;
        var doubleVowelMap = { 'aa': 'aX', 'ee': 'iX', 'oo': 'uX', 'ey': 'eX', 'oa': 'oX' };
        for (var pair in doubleVowelMap) {
          if (doubleVowelMap.hasOwnProperty(pair)) {
            var repl = doubleVowelMap[pair];
            var idx = val.indexOf(pair);
            while (idx !== -1) {
              val = val.substring(0, idx) + repl + val.substring(idx + 2);
              if (idx < cursor) cursor -= 1;
              changed = true;
              idx = val.indexOf(pair, idx + 2);
            }
          }
        }
        if (changed) {
          editor.value = val;
          editor.selectionStart = editor.selectionEnd = cursor;
        }

        setSaveStatus('saving');
        clearTimeout(window._saveTimer);
        window._saveTimer = setTimeout(function() { setSaveStatus('saved'); }, 600);
        var note = notes.find(function(n) { return n.id === activeId; });
        if (!note) return;
        note.content = editor.value;
        note.updatedAt = Date.now();
        if (note.title === 'untitled' || note.title === 'Untitled') {
          autoTitleFromContent(note);
        }
        var meta = document.getElementById('editorMeta');
        if (meta) meta.textContent = formatDate(note.updatedAt);
        persist(); renderSidebar();
      });
      editor.addEventListener('input', updateStats);

      var latinEditor = document.getElementById('latinEditor');
      if (latinEditor) {
        latinEditor.addEventListener('input', function() {
          if (!activeId) return;
          updateLatinPreview();
          updateStats();
        });
      }
    }

    var refBtn = document.getElementById('refBtn');
    if (refBtn) refBtn.addEventListener('click', openDrawer);
    var closeDrawerBtn = document.getElementById('closeDrawer');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);
    var drawerOverlay = document.getElementById('drawerOverlay');
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    var themeBtn = document.getElementById('themeBtn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    var newNoteBtn = document.getElementById('newNoteBtn');
    if (newNoteBtn) newNoteBtn.addEventListener('click', newNote);
    var exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', exportNoteAsPng);

    var openVnrBtn = document.getElementById('openVnrBtn');
    var vnrFileInput = document.getElementById('vnrFileInput');
    if (openVnrBtn && vnrFileInput) {
      openVnrBtn.addEventListener('click', function() { vnrFileInput.click(); });
      vnrFileInput.addEventListener('change', function() {
        if (this.files && this.files.length) {
          var file = this.files[0];
          var reader = new FileReader();
          reader.onload = function(e) {
            var raw = e.target.result;
            var MAGIC = 'VNR1';
            if (!raw || !raw.startsWith(MAGIC)) {
              showToast('Invalid or corrupted .vnr file');
              return;
            }
            try {
              var content = decodeURIComponent(escape(atob(raw.slice(MAGIC.length))));
              var note = { id: uid(), title: file.name.replace(/\.vnr$/i, '') || 'untitled', content: content, createdAt: Date.now(), updatedAt: Date.now(), pinned: false, tags: [] };
              notes.push(note);
              persist();
              renderSidebar();
              openNote(note.id);
              showToast('Opened .vnr file');
            } catch (_) {
              showToast('Failed to decode .vnr file');
            }
          };
          reader.onerror = function() { showToast('Failed to read file'); };
          reader.readAsText(file, 'UTF-8');
        }
        this.value = '';
      });
    }

    var searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', function() { searchQuery = this.value; renderSidebar(); });
    }

    document.querySelectorAll('.input-mode-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setInputMode(this.dataset.input); });
    });
    document.querySelectorAll('.latin-sub-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setLatinSubMode(this.dataset.sub); });
    });

    // Font size toggle
    document.querySelectorAll('.font-size-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { setFontSize(this.dataset.size); });
    });

    var exportVinaraBtn = document.getElementById('exportVinaraBtn');
    if (exportVinaraBtn) exportVinaraBtn.addEventListener('click', exportVinaraPreview);

    var sendToNoteBtn = document.getElementById('sendToNoteBtn');
    if (sendToNoteBtn) sendToNoteBtn.addEventListener('click', sendToNote);

    var shortcutsBtn = document.getElementById('shortcutsBtn');
    var shortcutsOverlay = document.getElementById('shortcutsOverlay');
    var closeShortcuts = document.getElementById('closeShortcutsModal');
    if (shortcutsBtn && shortcutsOverlay) {
      shortcutsBtn.addEventListener('click', function() { shortcutsOverlay.classList.add('open'); });
      if (closeShortcuts) closeShortcuts.addEventListener('click', function() { shortcutsOverlay.classList.remove('open'); });
      shortcutsOverlay.addEventListener('click', function(e) { if (e.target === e.currentTarget) shortcutsOverlay.classList.remove('open'); });
    }

    var hamburger = document.getElementById('hamburgerBtn');
    if (hamburger) {
      hamburger.addEventListener('click', function() { document.querySelector('.sidebar').classList.toggle('open'); });
    }

    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') { e.preventDefault(); newNote(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') { e.preventDefault(); var openVnrBtn = document.getElementById('openVnrBtn'); if (openVnrBtn) openVnrBtn.click(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); document.querySelector('.sidebar').classList.toggle('open'); }
      if (e.altKey && e.key === '1') { e.preventDefault(); switchTab('write'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openDrawer(); }
      if (e.key === 'Escape' && shortcutsOverlay && shortcutsOverlay.classList.contains('open')) shortcutsOverlay.classList.remove('open');
    });

    document.querySelectorAll('.tab').forEach(function(t) {
      t.addEventListener('click', function() { switchTab(t.dataset.tab); });
    });
  }

  // ── INIT ──
  function init() {
    initTheme();
    buildDrawer();
    renderSidebar();
    checkFont();
    updateStats();
    wireEvents();

    setInputMode(inputMode);
    setLatinSubMode(latinSubMode);
    setFontSize(fontSize);

    if (notes.length > 0) openNote(notes[notes.length - 1].id);
  }

  window.openNote       = openNote;
  window.togglePin      = togglePin;
  window.newNote        = newNote;
  window.renameNote     = renameNote;
  window.deleteNoteById = deleteNoteById;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
