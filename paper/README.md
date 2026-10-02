# SongSoong research paper

`songsoong_ieee.tex` is the authoritative manuscript. It uses the IEEEtran
conference two-column class for presentation on the project's Devpost page.
The paper has **not** been submitted to, accepted by, or published in IEEE
Xplore. The authors supplied names and email addresses only, so no
affiliations are asserted.

`songsoong_ieee_preview.pdf` is a readable three-page, two-column preview
rendered from the manuscript. It is **not** a TeX-engine output and should not
be treated as camera-ready IEEE typesetting: its equations, spacing, and
reference layout are simplified. The built-in LaTeX compiler was unavailable
in this environment (`Unable to find standard directories for platform`).
For a formal venue submission, compile the `.tex` source with an IEEEtran
installation and follow that venue's own author instructions.

The data counts and Coimbra records describe the bundled ENORA snapshot at
`src/data/enoraSnapshot.json` (fetched 2026-10-01). The five software checks
can be reproduced with `npm test`. There has been no listener study, and the
paper makes no claim of educational effectiveness or water-safety diagnosis.

To regenerate the local preview, run `python paper/render_preview.py` with
Pandoc, PyMuPDF (`fitz`), and Beautiful Soup available. The script does not
alter the `.tex` source.
