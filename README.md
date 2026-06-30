# Vinara

Vinara is a constructed writing system designed for bilingual Dhivehi and English use. It is written left-to-right, phonetically consistent, and built on the phonological foundation of Thaana — extended with four additional consonants and six standalone vowel characters to fully cover both Dhivehi and English.

This is version 4 of the script.

---

## The Script

35 characters total:

- 24 consonants derived from Thaana
- 4 additional consonants for English sounds (C, W, X, Q)
- 5 standalone vowel characters (A, E, I, O, U)
- 1 vowel extender
- 1 special character for stop (sukun)

Vinara can be written in two modes:

- **Phonetic mode** — for Dhivehi, where each character represents its exact sound
- **Orthographic mode** — for English, where conventional spelling is preserved

---

## Keyboard Mapping

Vinara follows the standard Dhivehi QWERTY layout that Maldivian speakers are already familiar with. No new muscle memory required.

| Key | Character      | Shift | Character    |
| --- | -------------- | ----- | ------------ |
| h   | ހ equivalent   | —     | —            |
| s   | ސ equivalent   | S     | ށ equivalent |
| n   | ނ equivalent   | N     | ޏ equivalent |
| r   | ރ equivalent   | —     | —            |
| b   | ބ equivalent   | —     | —            |
| l   | ލ equivalent   | L     | ޅ equivalent |
| k   | ކ equivalent   | —     | —            |
| w   | W consonant    | W     | އ equivalent |
| v   | ވ equivalent   | —     | —            |
| m   | މ equivalent   | —     | —            |
| f   | ފ equivalent   | —     | —            |
| d   | ޑ equivalent   | D     | ދ equivalent |
| t   | ޓ equivalent   | T     | ތ equivalent |
| g   | ގ equivalent   | —     | —            |
| z   | ޒ equivalent   | —     | —            |
| y   | ޔ equivalent   | —     | —            |
| p   | ޕ equivalent   | —     | —            |
| j   | ޖ equivalent   | —     | —            |
| c   | C consonant    | C     | ޗ equivalent |
| x   | X consonant    | —     | —            |
| q   | Q consonant    | —     | —            |
| a   | Vowel A        | —     | —            |
| e   | Vowel E        | —     | —            |
| i   | Vowel I        | —     | —            |
| o   | Vowel O        | —     | —            |
| u   | Vowel U        | —     | —            |
| X   | Vowel extender | —     | —            |
| Q   | Sukun          | —     | —            |

---

## Romanization

### Detection

| Condition                           | Mode                        |
| ----------------------------------- | --------------------------- |
| Contains vowel extender, no w/x/c/q | Dhivehi                     |
| Contains w/x/c/q, no extender       | English                     |
| Contains both                       | English (mixed default)     |
| Neither                             | English (ambiguous default) |

### Dhivehi Romanization

| Character | Romanization |
| --------- | ------------ |
| ހ         | h            |
| ށ         | sh           |
| ނ         | n            |
| ރ         | r            |
| ބ         | b            |
| ޅ         | lh           |
| ކ         | k            |
| އ         | (vowel only) |
| ވ         | v            |
| މ         | m            |
| ފ         | f            |
| ދ         | dh           |
| ތ         | th           |
| ލ         | l            |
| ގ         | g            |
| ޏ         | gn           |
| ސ         | s            |
| ޑ         | d            |
| ޒ         | z            |
| ޓ         | t            |
| ޔ         | y            |
| ޕ         | p            |
| ޖ         | j            |
| ޗ         | ch           |

### Vowels

| Character | Short | Extended |
| --------- | ----- | -------- |
| A         | a     | aa       |
| E         | e     | ey       |
| I         | i     | ee       |
| O         | o     | oa       |
| U         | u     | oo       |

### Sukun Rules

Sukun is implied when these consonants appear with no following vowel:

| Consonant | + sukun output |
| --------- | -------------- |
| ށ         | h              |
| ނ         | n              |
| ތ         | iy             |
| ސ         | s              |
| އ         | h              |

### Compound Collision Protection

| Sequence | Fix |
| -------- | --- |
| s + h    | s'h |
| d + h    | d'h |
| t + h    | t'h |
| l + h    | l'h |
| c + h    | c'h |
| g + n    | g'n |

---

## Files

```
vinara/
├── README.md
├── LICENSE
├── font/
│   ├── vinara.ttf        — installable font file
│   └── vinara.sfd        — FontForge source file
├── svg/
│   └── *.svg             — individual glyph files
├── figma/
│   └── vinara.fig        — Figma source file
├── docs/
│   ├── keyboard-map.md   — full keyboard mapping reference
│   ├── romanization.md   — romanization spec
│   └── transliteration.md — transliteration engine spec
└── app/
    └── index.html        — Vinara web app
```

---

## Try It

Live app: [vinara-seven.vercel.app](https://vinara-seven.vercel.app)

Type in Vinara script, save notes, export as text or image, and transliterate between Latin and Vinara.

---

## Contributing

Contributions are welcome — improved glyphs, bug fixes, additional language support, or documentation improvements.

1. Fork the repo
2. Create a branch for your changes
3. Submit a pull request with a clear description

For major changes like glyph redesigns, open an issue first to discuss.

---

## License

Vinara is released under the SIL Open Font License 1.1.

You are free to use, study, modify and redistribute this font, provided that:

- The font is not sold by itself
- Modified versions are released under the same license
- The reserved font name "Vinara" is not used for modified versions without permission

See [LICENSE](LICENSE) for the full license text.

---

_Created by [panseshi](https://github.com/panseshi)_
