"""
Style the pandoc reference.docx to match ASU graduation project template.
- Times New Roman 12pt body
- Proper heading hierarchy
- A4 page, 2.5cm margins
- Normal spacing
"""
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
import copy

doc = Document('reference.docx')

# ── Page layout: A4, 2.5cm margins ───────────────────────────────────────────
for section in doc.sections:
    section.page_width  = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin   = Cm(2.5)
    section.right_margin  = Cm(2.5)
    section.top_margin    = Cm(2.5)
    section.bottom_margin = Cm(2.5)

def set_style(style, font_name, font_size, bold=False, color=None,
              space_before=0, space_after=6, line_spacing=None,
              alignment=None):
    """Apply font + paragraph settings to a named style."""
    try:
        s = doc.styles[style]
    except KeyError:
        return
    f = s.font
    f.name = font_name
    f.size = Pt(font_size)
    f.bold = bold
    if color:
        f.color.rgb = RGBColor(*color)
    else:
        f.color.rgb = RGBColor(0, 0, 0)

    pf = s.paragraph_format
    pf.space_before = Pt(space_before)
    pf.space_after  = Pt(space_after)
    if line_spacing:
        pf.line_spacing = Pt(line_spacing)
    if alignment is not None:
        pf.alignment = alignment

# ── Normal / body text ────────────────────────────────────────────────────────
set_style('Normal', 'Times New Roman', 12, space_before=0, space_after=6, line_spacing=14)

# ── Headings ──────────────────────────────────────────────────────────────────
# Chapter heading (H1) — bold, 16pt, black, centered
set_style('Heading 1', 'Times New Roman', 16, bold=True,
          space_before=18, space_after=12, alignment=WD_ALIGN_PARAGRAPH.CENTER)

# Section heading (H2) — bold, 14pt
set_style('Heading 2', 'Times New Roman', 14, bold=True,
          space_before=14, space_after=8)

# Subsection (H3) — bold, 13pt
set_style('Heading 3', 'Times New Roman', 13, bold=True,
          space_before=10, space_after=6)

# Sub-subsection (H4) — bold italic, 12pt
set_style('Heading 4', 'Times New Roman', 12, bold=True,
          space_before=8, space_after=4)

# ── Table styles ─────────────────────────────────────────────────────────────
set_style('Table Grid', 'Times New Roman', 11)

# ── Code blocks ─────────────────────────────────────────────────────────────
for style_name in ['Verbatim Char', 'Source Code', 'Code']:
    try:
        s = doc.styles[style_name]
        s.font.name = 'Courier New'
        s.font.size = Pt(9)
    except KeyError:
        pass

doc.save('reference.docx')
print("reference.docx styled successfully.")
