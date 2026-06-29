/* ─── Vinara VNR File Handler ──────────────────────────────────
 *  Custom .vnr format: "VNR1" header + Base64-encoded content.
 *  Part of Skyrise Travels (skyrisetravels.com/vinara)
 * ───────────────────────────────────────────────────────────── */

var VNRHandler = (function () {
  'use strict';

  var FILE_EXT = '.vnr';
  var MAGIC    = 'VNR1';
  var DOM      = {};

  function init(el) {
    DOM = {
      note:   el.note   || document.getElementById('noteContent'),
      fname:  el.fname  || document.getElementById('filename'),
      open:   el.open   || document.getElementById('openBtn'),
      save:   el.save   || document.getElementById('saveBtn'),
      newBtn: el.newBtn || document.getElementById('newBtn'),
      fileIn: el.fileIn || document.getElementById('fileInput')
    };
    wireEvents();
  }

  function encodeVnr(plain) {
    return MAGIC + btoa(unescape(encodeURIComponent(plain)));
  }

  function decodeVnr(raw) {
    if (!raw || !raw.startsWith(MAGIC)) return null;
    try {
      return decodeURIComponent(escape(atob(raw.slice(MAGIC.length))));
    } catch (_) { return null; }
  }

  function newNote() {
    if (DOM.note && DOM.note.value.trim() !== '' &&
        !confirm('Create a new note? Any unsaved changes will be lost.')) return;
    if (DOM.note) DOM.note.value = '';
    if (DOM.fname) DOM.fname.value = 'untitled';
    if (DOM.note) DOM.note.focus();
  }

  function openFile(file, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var dec = decodeVnr(e.target.result);
      if (dec === null) { alert('Invalid or corrupted .vnr file.'); return; }
      if (DOM.note) DOM.note.value = dec;
      if (DOM.fname) {
        DOM.fname.value = file.name.replace(new RegExp('\\' + FILE_EXT + '$', 'i'), '') || 'untitled';
      }
      if (callback) callback(dec);
    };
    reader.onerror = function () { alert('Failed to read file.'); };
    reader.readAsText(file, 'UTF-8');
  }

  function saveNote() {
    var name = (DOM.fname && DOM.fname.value.trim()) || 'untitled';
    var content = DOM.note ? DOM.note.value : '';
    var blob = new Blob([encodeVnr(content)], { type: 'application/octet-stream' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href = url; a.download = name + FILE_EXT;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);

    if (DOM.save) {
      DOM.save.innerHTML = '&#10003; Saved';
      setTimeout(function () {
        DOM.save.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg> Save';
      }, 1200);
    }
  }

  function wireEvents() {
    if (DOM.newBtn) DOM.newBtn.addEventListener('click', newNote);
    if (DOM.open) DOM.open.addEventListener('click', function () { if (DOM.fileIn) DOM.fileIn.click(); });
    if (DOM.fileIn) DOM.fileIn.addEventListener('change', function () {
      if (this.files && this.files.length) openFile(this.files[0]);
      this.value = '';
    });
    if (DOM.save) DOM.save.addEventListener('click', saveNote);
  }

  return {
    init:      init,
    encode:    encodeVnr,
    decode:    decodeVnr,
    newNote:   newNote,
    openFile:  openFile,
    saveNote:  saveNote
  };

})();
