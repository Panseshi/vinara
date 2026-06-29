/* ─── Vinara Transliteration Engine ────────────────────────────
 *  Converts Latin keyboard input into Vinara script characters.
 *  The Vinara font renders these Latin characters as custom glyphs.
 *
 *  Two modes:
 *    • Dhivehi mode — uses Dhivehi romanization rules (same QWERTY
 *      layout Maldivians use for Thaana typing). Multi-letter sequences
 *      like "sh", "aa", "lh" are collapsed into single Vinara chars.
 *    • English mode — letter-by-letter mapping. Each Latin key maps
 *      to its corresponding Vinara glyph directly.
 *
 *  Part of Skyrise Travels (skyrisetravels.com/vinara)
 * ───────────────────────────────────────────────────────────── */

var VinaraTranslit = (function () {
  'use strict';

  var M = VINARA_MAP;

  // ─────────────────────────────────────────────
  // 1. Language Detection
  // ─────────────────────────────────────────────

  // Detect whether input is more likely Dhivehi or English romanization.
  // Dhivehi indicators: compound consonants (sh, lh, dh, th, gn, ch) or
  // long vowel pairs (aa, ee, ey, oo, oa).
  // English indicators: English-only keys (w, x, c, q) or common English digraphs.
  var DHIVEHI_RE = /sh|lh|dh|th|gn|ch|aa|ee|ey|oo|oa/;
  var ENGLISH_RE = /[wxcqWXCQ]/;

  function detectMode(text) {
    if (!text || text.trim() === '') {
      return { mode: 'english', reason: 'empty input' };
    }
    var hasDhivehi = DHIVEHI_RE.test(text);
    var hasEnglish = ENGLISH_RE.test(text);

    if (hasDhivehi && !hasEnglish) {
      return { mode: 'dhivehi', reason: 'Dhivehi romanization detected' };
    }
    if (hasEnglish && !hasDhivehi) {
      return { mode: 'english', reason: 'English-only keys detected' };
    }
    if (hasDhivehi && hasEnglish) {
      return { mode: 'english', reason: 'mixed content' };
    }
    return { mode: 'english', reason: 'ambiguous default' };
  }

  // ─────────────────────────────────────────────
  // 2. English Mode — letter-by-letter
  // ─────────────────────────────────────────────

  /** English mode: each Latin character maps to its Vinara glyph.
   *  Vowels that appear without a preceding consonant get the alifu
   *  carrier (W) prefixed, matching the visual structure of the script.
   */
  function englishMode(text) {
    if (!text) return '';
    var out = '';
    var prevWasConsonant = false;

    for (var i = 0, len = text.length; i < len; i++) {
      var ch = text[i];

      // Consonant (including Dhivehi consonants and English-only)
      if (M.CONSONANT_KEYS[ch] || M.ENGLISH_KEYS[ch]) {
        out += M.CONSONANTS[ch] || M.ENGLISH_ONLY[ch] || ch;
        prevWasConsonant = true;
        continue;
      }

      // Vowel
      if (M.VOWEL_KEYS[ch]) {
        if (!prevWasConsonant) {
          out += M.ALIFU;  // vowel carrier for standalone vowels
        }
        out += M.VOWELS[ch];
        prevWasConsonant = false;
        continue;
      }

  // Extender (X) — pass through as-is (only for extending vowels, NOT sukun)
      if (ch === M.EXTENDER) {
        out += ch;
        prevWasConsonant = false;
        continue;
      }

      // Sukun (°) — pass through as-is (dedicated sukun character)
      if (ch === M.SUKUN) {
        out += ch;
        prevWasConsonant = false;
        continue;
      }

      // Everything else (spaces, punctuation, digits) — pass through
      out += ch;
      prevWasConsonant = false;
    }
    return out;
  }

  // ─────────────────────────────────────────────
  // 3. Dhivehi Mode — full romanization
  // ─────────────────────────────────────────────

  /** Dhivehi mode: applies Dhivehi romanization rules.
   *  • Multi-letter compounds (sh, lh, dh, th, gn, ch) → single char
   *  • Long vowels (aa, ee, ey, oo, oa) → vowel + extender (a+X, i+X, etc.)
   *  • Standalone vowels get alifu (W) prefix
   *  • Word-final h, s, n before space or '.' get sukun (h→WQ, s→sQ, n→nQ)
   */
  function dhivehiMode(text) {
    if (!text) return '';
    var out = '';
    var i = 0, len = text.length;
    var prevWasConsonant = false;

    while (i < len) {
      var ch = text[i];
      var nextCh = i + 1 < len ? text[i + 1] : null;
      var nextNextCh = i + 2 < len ? text[i + 2] : null;

      // ── Check for multi-letter compounds first ──

      // Explicit sh sukun: hh → SQ (shaviyani + sukun, ށް)
      // This is a custom user convenience, not standard romanization.
      if (ch === 'h' && nextCh === 'h') {
        out += M.SUKUN_CONSONANTS['S'];
        i += 2;
        prevWasConsonant = true;
        continue;
      }

      // Dhivehi compound consonants: sh, lh, dh, th, gn, ch
      var compound = ch + (nextCh || '');
      if (M.DHIVEHI_COMPOUNDS[compound]) {
        out += M.DHIVEHI_COMPOUNDS[compound];
        i += 2;
        prevWasConsonant = true;
        continue;
      }

      // Long vowels: aa, ee, ey, oo, oa → vowel + extender
      //   aa → aX,  ee → iX,  oo → uX,  ey → eX,  oa → oX
      if (M.LONG_VOWEL_PAIRS[compound]) {
        if (!prevWasConsonant) {
          out += M.ALIFU;  // alifu carries standalone long vowel
        }
        out += M.LONG_VOWEL_PAIRS[compound];
        i += 2;
        prevWasConsonant = false;
        continue;
      }

      // Uppercase vowel (A, E, I, O, U) → vowel + extender directly
      // These are typed as Shift+vowel on some keyboards; treat same as long vowel pairs.
      var upperVowel = { 'A': 'a' + M.EXTENDER, 'E': 'e' + M.EXTENDER, 'I': 'i' + M.EXTENDER, 'O': 'o' + M.EXTENDER, 'U': 'u' + M.EXTENDER };
      if (upperVowel[ch]) {
        if (!prevWasConsonant) {
          out += M.ALIFU;
        }
        out += upperVowel[ch];
        i += 1;
        prevWasConsonant = false;
        continue;
      }

      // Consonant
      if (M.CONSONANT_KEYS[ch]) {
        // Check if this consonant is at a word ending (next is space or '.')
        // and is one of the sukun consonants (h, s, n)
        var isWordEnd = (nextCh === ' ' || nextCh === '.' || nextCh === null);
        if (isWordEnd && M.SUKUN_CONSONANTS[ch]) {
          out += M.SUKUN_CONSONANTS[ch];
        } else if (ch === 'h' && nextCh && (M.CONSONANT_KEYS[nextCh] || M.ENGLISH_KEYS[nextCh])) {
          // h before another consonant (in the middle of a word) → alifu sukun (އް)
          out += M.SUKUN_CONSONANTS['h'];
        } else {
          out += M.CONSONANTS[ch];
        }
        i += 1;
        prevWasConsonant = true;
        continue;
      }

      // English-only letter (pass through in Dhivehi mode too)
      if (M.ENGLISH_KEYS[ch]) {
        out += M.ENGLISH_ONLY[ch];
        i += 1;
        prevWasConsonant = true;
        continue;
      }

      // Vowel
      if (M.VOWEL_KEYS[ch]) {
        if (!prevWasConsonant) {
          out += M.ALIFU;  // alifu carries standalone vowel
        }
        out += M.VOWELS[ch];
        i += 1;
        prevWasConsonant = false;
        continue;
      }

      // Extender (X) — pass through (only for extending vowels)
      if (ch === M.EXTENDER) {
        out += ch;
        i += 1;
        prevWasConsonant = false;
        continue;
      }

      // Sukun (°) — pass through (dedicated sukun character)
      if (ch === M.SUKUN) {
        out += ch;
        i += 1;
        prevWasConsonant = false;
        continue;
      }

      // Everything else — pass through
      out += ch;
      i += 1;
      prevWasConsonant = false;
    }

    return out;
  }

  // ─────────────────────────────────────────────
  // 4. Main entry point
  // ─────────────────────────────────────────────

  function latinToVinara(text, forcedMode) {
    if (!text) return '';
    var mode = forcedMode || detectMode(text).mode;
    if (mode === 'dhivehi') return dhivehiMode(text);
    return englishMode(text);
  }

  // ─────────────────────────────────────────────
  // 5. Reverse: Vinara → Latin romanization
  // ─────────────────────────────────────────────

  /** Convert Vinara characters back to Latin romanization.
   *  This is useful for export or when users want to see the
   *  keyboard input that produced a given Vinara text.
   */
  function vinaraToLatin(text) {
    if (!text) return '';
    var out = '';
    var i = 0, len = text.length;

    while (i < len) {
      var ch = text[i];
      var nextCh = i + 1 < len ? text[i + 1] : null;

      // Skip alifu (W) — it's a vowel carrier, not part of output
      if (ch === M.ALIFU) {
        i += 1;
        continue;
      }

      // Alifu + sukun (WQ) = word-final h (glottal stop)
      // This must be checked BEFORE the general consonant+sukun check
      // because W (alifu) is also listed in CONSONANTS.
      if (ch === M.ALIFU && nextCh === M.SUKUN) {
        out += 'h';
        i += 2;
        continue;
      }

      // Vowel + extender = long vowel
      if (M.VOWELS[ch] && nextCh === M.EXTENDER) {
        var longV = M.VOWELS[ch] + M.EXTENDER;
        var found = false;
        for (var key in M.LONG_VOWEL_PAIRS) {
          if (M.LONG_VOWEL_PAIRS.hasOwnProperty(key) && M.LONG_VOWEL_PAIRS[key] === longV) {
            out += key;
            found = true;
            break;
          }
        }
        if (!found) {
          out += ch;  // fallback
        }
        i += 2;
        continue;
      }

      // Consonant + sukun (°)
      if (M.CONSONANTS[ch] && nextCh === M.SUKUN) {
        // Check if it's a known sukun consonant
        var sukun = M.SUKUN_CONSONANTS[ch];
        if (sukun) {
          // Output the consonant's romanization (sukun form)
          var roman = M.CONSONANTS[ch];
          if (ch === 'S') roman = 'sh';
          else if (ch === 'L') roman = 'lh';
          else if (ch === 'D') roman = 'dh';
          else if (ch === 'T') roman = 'th';
          else if (ch === 'N') roman = 'gn';
          else if (ch === 'C') roman = 'ch';
          out += roman;
        } else {
          out += M.CONSONANTS[ch] || ch;
        }
        i += 2;
        continue;
      }

      // Regular consonant
      if (M.CONSONANTS[ch]) {
        var roman = M.CONSONANTS[ch];
        if (ch === 'S') roman = 'sh';
        else if (ch === 'L') roman = 'lh';
        else if (ch === 'D') roman = 'dh';
        else if (ch === 'T') roman = 'th';
        else if (ch === 'N') roman = 'gn';
        else if (ch === 'C') roman = 'ch';
        else if (ch === 'W') roman = 'W';  // alifu
        out += roman;
        i += 1;
        continue;
      }

      // English-only letter
      if (M.ENGLISH_ONLY[ch]) {
        out += M.ENGLISH_ONLY[ch];
        i += 1;
        continue;
      }

      // Vowel
      if (M.VOWELS[ch]) {
        out += M.VOWELS[ch];
        i += 1;
        continue;
      }

      // Everything else
      out += ch;
      i += 1;
    }

    return out;
  }

  // ─────────────────────────────────────────────
  // 6. Public API
  // ─────────────────────────────────────────────

  return {
    detectMode:      detectMode,
    latinToVinara:   latinToVinara,
    vinaraToLatin:   vinaraToLatin,
    englishMode:     englishMode,
    dhivehiMode:     dhivehiMode
  };

})();
