/* ─── Vinara Character Mapping ────────────────────────────────
 *  Vinara is a custom left-to-right script that replaces Thaana.
 *  It uses the same QWERTY keyboard layout Maldivians use for
 *  Dhivehi typing, but renders custom glyphs via the Vinara font.
 *
 *  Font glyph structure (48 glyphs total):
 *    1-24:  Dhivehi consonants (customised Thaana characters)
 *    25-28: c, q, w, x (English-only letters missing in Thaana)
 *    29-33: a, i, u, e, o (vowels)
 *    34:    X — vowel extender (doubles vowel)
 *    35:    Q — dedicated sukun character (Shift+Q)
 *
 *  The font maps Latin characters directly:
 *    Consonants: h S n r b L k W v m f D T l g N s d z t y p j C
 *    English:    c q w x
 *    Vowels:     a i u e o
 *    Extender:   X
 *    Sukun:      Q (Shift+Q)
 *    Uppercase vowels A E I O U also exist as separate glyphs.
 *
 *  Part of Skyrise Travels (skyrisetravels.com/vinara)
 * ───────────────────────────────────────────────────────────── */

var VINARA_MAP = (function () {
  'use strict';

  // ── 24 Dhivehi consonants (positions 1-24) ──
  // Uppercase keys are used for sounds that need multi-letter
  // romanization in standard Latin (sh, lh, dh, th, gn, ch).
  var CONSONANTS = {
    'h': 'h',   // 1  — ހ custom
    'S': 'S',   // 2  — ށ custom (sh)
    'n': 'n',   // 3  — ނ custom
    'r': 'r',   // 4  — ރ custom
    'b': 'b',   // 5  — ބ custom
    'L': 'L',   // 6  — ޅ custom (lh)
    'k': 'k',   // 7  — ކ custom
    'W': 'W',   // 8  — އ custom (alifu — vowel carrier)
    'v': 'v',   // 9  — ވ custom
    'm': 'm',   // 10 — މ custom
    'f': 'f',   // 11 — ފ custom
    'D': 'D',   // 12 — ދ custom (dh)
    'T': 'T',   // 13 — ތ custom (th)
    'l': 'l',   // 14 — ލ custom
    'g': 'g',   // 15 — ގ custom
    'N': 'N',   // 16 — ޏ custom (gn)
    's': 's',   // 17 — ސ custom
    'd': 'd',   // 18 — ޑ custom
    'z': 'z',   // 19 — ޒ custom
    't': 't',   // 20 — ޓ custom
    'y': 'y',   // 21 — ޔ custom
    'p': 'p',   // 22 — ޕ custom
    'j': 'j',   // 23 — ޖ custom
    'C': 'C'    // 24 — ޗ custom (ch)
  };

  // ── 4 English-only letters (positions 25-28) ──
  var ENGLISH_ONLY = {
    'c': 'c',   // 25
    'q': 'q',   // 26
    'w': 'w',   // 27
    'x': 'x'    // 28
  };

  // ── 5 vowels (positions 29-33) ──
  var VOWELS = {
    'a': 'a',   // 29 — short a
    'i': 'i',   // 30 — short i
    'u': 'u',   // 31 — short u
    'e': 'e',   // 32 — short e
    'o': 'o'    // 33 — short o
  };

  // ── Vowel extender (position 34) — doubles vowels ──
  var EXTENDER = 'X';

  // ── Sukun character (position 35) — no vowel ──
  // Dedicated sukun character. Bound to Shift+Q.
  var SUKUN = 'Q';

  // ── Alifu (vowel carrier) ──
  var ALIFU = 'W';

  // ── All valid Vinara characters ──
  var ALL_CHARS = {};
  var k;
  for (k in CONSONANTS)  { if (CONSONANTS.hasOwnProperty(k))  ALL_CHARS[CONSONANTS[k]] = true; }
  for (k in ENGLISH_ONLY) { if (ENGLISH_ONLY.hasOwnProperty(k)) ALL_CHARS[ENGLISH_ONLY[k]] = true; }
  for (k in VOWELS)       { if (VOWELS.hasOwnProperty(k))       ALL_CHARS[VOWELS[k]] = true; }
  ALL_CHARS[SUKUN] = true;
  ALL_CHARS[ALIFU] = true;

  // ── Input key sets (for detection) ──
  var CONSONANT_KEYS = {};
  for (k in CONSONANTS) { if (CONSONANTS.hasOwnProperty(k)) CONSONANT_KEYS[k] = true; }

  var VOWEL_KEYS = {};
  for (k in VOWELS) { if (VOWELS.hasOwnProperty(k)) VOWEL_KEYS[k] = true; }

  var ENGLISH_KEYS = {};
  for (k in ENGLISH_ONLY) { if (ENGLISH_ONLY.hasOwnProperty(k)) ENGLISH_KEYS[k] = true; }

  // ── Dhivehi romanization: multi-letter sequences → single Vinara char ──
  var DHIVEHI_COMPOUNDS = {
    'sh': 'S',
    'lh': 'L',
    'dh': 'D',
    'th': 'T',
    'gn': 'N',
    'ch': 'C'
  };

  // ── Dhivehi long vowel romanization: pairs → vowel + extender ──
  // Since uppercase A/E/I/O/U are not part of the original 48-glyph set,
  // long vowels are represented as vowel + extender (a+X, i+X, etc.).
  //   aa → aX,  ee → iX,  oo → uX,  ey → eX,  oa → oX
  var LONG_VOWEL_PAIRS = {
    'aa': 'a' + EXTENDER,
    'ee': 'i' + EXTENDER,
    'oo': 'u' + EXTENDER,
    'ey': 'e' + EXTENDER,
    'oa': 'o' + EXTENDER
  };

  // ── Sukun consonants ──
  // These consonants can appear with no vowel (implied sukun) at word endings.
  // In Vinara, they are written as consonant + sukun (Q).
  // Word-final 'h' (glottal stop) maps to alifu + sukun (WQ → އް).
  var SUKUN_CONSONANTS = {
    'h': ALIFU + SUKUN,  // word-final h → alifu sukun (އް)
    'n': 'n' + SUKUN,    // n → nQ (ން)
    's': 's' + SUKUN,    // s → sQ (ސް)
    'S': 'S' + SUKUN,    // sh → shQ (ށް)
    'T': 'T' + SUKUN,    // th → thQ
    'W': 'W' + SUKUN     // alifu → WQ
  };

  // ── Compound collision protection ──
  // When these consonant pairs appear, they need special handling
  // to avoid ambiguity in the Latin output.
  var COLLISION_PAIRS = [
    { first: 's', second: 'h', output: "s'h" },   // s + h (not sh)
    { first: 'D', second: 'h', output: "d'h" },  // D + h (not dh)
    { first: 'T', second: 'h', output: "t'h" },  // T + h (not th)
    { first: 'l', second: 'h', output: "l'h" },  // l + h (not lh)
    { first: 'C', second: 'h', output: "c'h" },  // C + h (not ch)
    { first: 'g', second: 'n', output: "g'n" }   // g + n (not gn)
  ];

  // Build collision lookup
  var COLLISION_MAP = {};
  COLLISION_PAIRS.forEach(function (p) {
    COLLISION_MAP[p.first + p.second] = p.output;
  });

  // ── Public API ──
  return {
    CONSONANTS:        CONSONANTS,
    ENGLISH_ONLY:      ENGLISH_ONLY,
    VOWELS:            VOWELS,
    EXTENDER:          EXTENDER,
    SUKUN:             SUKUN,
    ALIFU:             ALIFU,
    ALL_CHARS:         ALL_CHARS,
    CONSONANT_KEYS:    CONSONANT_KEYS,
    VOWEL_KEYS:        VOWEL_KEYS,
    ENGLISH_KEYS:      ENGLISH_KEYS,
    DHIVEHI_COMPOUNDS: DHIVEHI_COMPOUNDS,
    LONG_VOWEL_PAIRS:  LONG_VOWEL_PAIRS,
    SUKUN_CONSONANTS:  SUKUN_CONSONANTS,
    COLLISION_MAP:     COLLISION_MAP
  };

})();
