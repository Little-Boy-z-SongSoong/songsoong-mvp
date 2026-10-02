"""Create a readable two-column PDF preview when an IEEE TeX engine is absent.

The .tex file is the authoritative IEEEtran source. This preview uses Pandoc
and PyMuPDF for the Devpost handout and is not an IEEE production PDF.
"""

from pathlib import Path
from html import escape
import re
import subprocess
import tempfile
import unicodedata

from bs4 import BeautifulSoup
import fitz


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "songsoong_ieee.tex"
DESTINATION = ROOT / "songsoong_ieee_preview.pdf"

CITATIONS = {
    "oah-cities": 1,
    "enora-api": 2,
    "handbook": 3,
    "stpierre2016": 4,
    "oah-solutions": 5,
    "tonejs": 6,
    "songsoong-code": 7,
}

REFERENCES = [
    'OneAquaHealth, "Research Cities." https://www.oneaquahealth.eu/research-cities/ (accessed Oct. 2, 2026).',
    'ENORA, "OneAquaHealth API: Swagger UI." https://api.enora-oah.eu/swagger-ui/index.html (accessed Oct. 2, 2026).',
    'T. Hermann, A. Hunt, and J. G. Neuhoff, eds., The Sonification Handbook. Berlin: Logos Verlag, 2011.',
    'M. St. Pierre and M. Droumeva, "Sonifying for public engagement: A context-based model for sonifying air pollution data," Proc. 22nd Int. Conf. Auditory Display, 2016, doi:10.21785/icad2016.033.',
    'OneAquaHealth, "Solutions." https://www.oneaquahealth.eu/project-solutions/ (accessed Oct. 2, 2026).',
    'Tone.js, "Tone.js: Web Audio framework for interactive music." https://tonejs.github.io/ (accessed Oct. 2, 2026).',
    "Little Boy'z SongSoong Team, SongSoong source code. https://github.com/Little-Boy-z-SongSoong/songsoong-mvp (accessed Oct. 2, 2026).",
]


def convert_source():
    with tempfile.TemporaryDirectory() as tmp:
        html_path = Path(tmp) / "source.html"
        subprocess.run(
            ["pandoc", str(SOURCE), "-f", "latex", "-t", "html", "--standalone", "-o", str(html_path)],
            check=True, capture_output=True, text=True,
        )
        return BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")


def prepare_body(soup):
    body = soup.body
    header = body.find("header", id="title-block-header")
    abstract = header.find("div", class_="abstract")
    abstract_title = abstract.find("div", class_="abstract-title")
    abstract_title.decompose()
    abstract_html = str(abstract.find("p"))
    header.decompose()

    keywords = body.find("div", class_="IEEEkeywords")
    keyword_text = keywords.get_text(" ", strip=True)
    keywords.decompose()
    bibliography = body.find("div", class_="thebibliography")
    bibliography.decompose()

    for citation in body.select("span.citation"):
        keys = citation.get("data-cites", "").split()
        numbers = ", ".join(str(CITATIONS[key]) for key in keys if key in CITATIONS)
        citation.replace_with(f"[{numbers}]")

    for display in body.select("span.math.display"):
        raw = display.get_text(" ", strip=True)
        if "s(q)=" in raw:
            text = "s(q): High 0.08 · Good 0.25 · Moderate 0.49 · Poor 0.73 · Bad 0.92   (1)"
        else:
            text = "S(site) = mean of available biological s(q), K > 0   (2)"
        replacement = soup.new_tag("div", attrs={"class": "equation"})
        replacement.string = text
        display.replace_with(replacement)

    figure = body.find("figure", id="fig:architecture")
    if figure:
        figure.clear()
        diagram = soup.new_tag("div", attrs={"class": "diagram"})
        diagram.string = (
            "ENORA public API  →  Vercel proxy / build snapshot  →  "
            "React data adapter  →  mapping rules  →  Tone.js / Web Audio  →  listener"
        )
        figure.append(diagram)
        caption = soup.new_tag("figcaption")
        caption.string = "Fig. 1. Data paths and local browser synthesis."
        figure.append(caption)

    for table_id, label in [
        ("tab:mapping", "TABLE I. DATA-TO-SOUND MAPPING"),
        ("tab:pair", "TABLE II. SAME-DAY COIMBRA LISTENING PAIR"),
    ]:
        table = body.find("div", id=table_id)
        if table:
            table.insert(0, soup.new_tag("p", attrs={"class": "table-label"}))
            table.p.string = label
            if table.table.caption:
                table.table.caption.decompose()

    for heading in body.find_all("h1"):
        if heading.get("id"):
            heading["class"] = ["section-heading"]
    for heading in body.find_all("h2"):
        heading["class"] = ["subsection-heading"]

    # The local renderer's default hyperlink blue is distracting in print.
    # The authoritative TeX source retains its URL and cross-reference links.
    for anchor in body.find_all("a"):
        anchor.unwrap()

    references = "".join(f"<p class='reference'>[{i}] {escape(ref)}</p>" for i, ref in enumerate(REFERENCES, 1))
    contents = "".join(str(child) for child in body.contents)
    return (
        f"<div class='abstract'><b>Abstract—</b>{abstract_html}</div>"
        f"<p class='keywords'><b>Index Terms—</b>{escape(keyword_text)}</p>"
        + contents
        + f"<h1 class='section-heading'>References</h1>{references}"
    )


def make_pdf(body_html):
    page_width, page_height = 612, 792  # US Letter
    margin_left, margin_right = 48, 48
    margin_bottom = 48
    gap = 18
    column_width = (page_width - margin_left - margin_right - gap) / 2

    title_html = """
    <div class='title'>SongSoong: Transparent Sonification of Urban Stream<br>
    Observations for Public Engagement</div>
    <div class='authors'>Vo Duc Hieu · Tran Minh Hoang · Nguyen Vo Dinh Nguyen<br>
    Vo Duy Nguyen · Le Huynh Dang</div>
    <div class='emails'>voduchieu42@gmail.com · andyjobs2023@gmail.com · nguyenvodinhkhoi92@gmail.com<br>
    duyynguyen1303@gmail.com · lehuynhdang.um2023@gmail.com</div>
    """
    title_css = """
    * { font-family: 'Times New Roman'; }
    .title {font-size: 17pt; font-weight: bold; line-height: 1.08; text-align: center; margin: 0 0 11pt;}
    .authors {font-size: 9pt; line-height: 1.16; text-align: center; margin: 0 0 6pt;}
    .emails {font-size: 7.2pt; line-height: 1.1; text-align: center; margin: 0;}
    """
    body_css = """
    * {font-family: 'Times New Roman'; color: #111;}
    body {font-size: 9.2pt; line-height: 1.12; text-align: justify;}
    p {margin: 0 0 5.2pt;}
    .abstract {margin: 0 0 5pt;}
    .abstract p {display: inline;}
    .keywords {margin: 0 0 11pt;}
    .section-heading {font-size: 9.4pt; font-weight: bold; text-transform: uppercase;
      text-align: center; margin: 10pt 0 4.2pt;}
    .subsection-heading {font-size: 9.2pt; font-weight: bold; font-style: italic;
      margin: 7pt 0 3pt;}
    .equation {font-size: 8.2pt; text-align: center; margin: 4pt 0 5pt;}
    .table-label {font-size: 7.5pt; text-align: center; font-weight: bold; margin: 5pt 0 2pt;}
    table {font-size: 7.2pt; border-collapse: collapse; width: 100%; margin: 0 0 6pt;}
    th, td {padding: 2pt; border-bottom: .35pt solid #aaa; vertical-align: top;}
    th {font-weight: bold; border-top: .8pt solid #222;}
    figure {margin: 4pt 0 8pt; padding: 0;}
    .diagram {font-size: 8pt; border: .5pt solid #333; padding: 5pt; text-align: center;}
    figcaption {font-size: 7.5pt; text-align: center; margin-top: 3pt;}
    .reference {font-size: 7.7pt; line-height: 1.1; margin: 0 0 3pt;}
    a {color: #111; text-decoration: none;}
    """
    title_story = fitz.Story(title_html, user_css=title_css, em=9)
    story = fitz.Story(body_html, user_css=body_css, em=9.2)
    writer = fitz.DocumentWriter(str(DESTINATION))
    page_number = 0
    more = True
    while more:
        device = writer.begin_page(fitz.Rect(0, 0, page_width, page_height))
        if page_number == 0:
            title_story.place(fitz.Rect(margin_left, 40, page_width - margin_right, 145))
            title_story.draw(device)
        top = 160 if page_number == 0 else 45
        bottom = 395 if page_number == 2 else page_height - margin_bottom
        for column in range(2):
            x = margin_left + column * (column_width + gap)
            more, _ = story.place(fitz.Rect(x, top, x + column_width, bottom))
            story.draw(device)
            if not more:
                break
        writer.end_page()
        page_number += 1
        if page_number > 20:
            raise RuntimeError("Unexpectedly long preview PDF")
    writer.close()
    document = fitz.open(DESTINATION)
    print(f"Wrote {DESTINATION} ({document.page_count} pages)")
    expected = ["Introduction", "Data and Sonification Method", "Conclusion", "References"]
    full_text = unicodedata.normalize("NFKC", "\n".join(page.get_text() for page in document))
    full_text = re.sub(r"\s+", " ", full_text).lower()
    missing = [term for term in expected if term.lower() not in full_text]
    if missing:
        raise RuntimeError(f"PDF is missing: {missing}")


if __name__ == "__main__":
    make_pdf(prepare_body(convert_source()))
