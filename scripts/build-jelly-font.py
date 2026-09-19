"""Subset the existing OFL Manrope font into Three.js outline data. Requires fontTools."""
import json
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.basePen import BasePen

root = Path(__file__).resolve().parent.parent
font = TTFont(root / 'node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2')
font = instantiateVariableFont(font, {'wght': 800}, inplace=True)
glyph_set = font.getGlyphSet()
class OutlinePen(BasePen):
    def __init__(self):
        super().__init__(glyph_set)
        self.commands = []
    def point(self, pt):
        return f'{round(pt[0], 2)} {round(pt[1], 2)}'
    def _moveTo(self, p): self.commands.append('m ' + self.point(p))
    def _lineTo(self, p): self.commands.append('l ' + self.point(p))
    def _qCurveToOne(self, c, p): self.commands.append('q ' + self.point(p) + ' ' + self.point(c))
    def _curveToOne(self, a, b, p): self.commands.append('b ' + self.point(p) + ' ' + self.point(a) + ' ' + self.point(b))
    def _closePath(self): pass

glyphs = {}
for char in set('VikramRamkumar?'):
    name = font.getBestCmap()[ord(char)]
    pen = OutlinePen()
    glyph_set[name].draw(pen)
    glyphs[char] = {'ha': glyph_set[name].width, 'o': ' '.join(pen.commands)}
result = {'glyphs': glyphs, 'familyName': 'Manrope', 'ascender': font['hhea'].ascent,
          'descender': font['hhea'].descent, 'underlinePosition': -100, 'underlineThickness': 50,
          'boundingBox': {'yMin': font['head'].yMin, 'yMax': font['head'].yMax},
          'resolution': font['head'].unitsPerEm, 'original_font_information': {'license': 'SIL Open Font License 1.1'}}
(root / 'src/assets/manrope-jelly.json').write_text(json.dumps(result, separators=(',', ':')) + '\n')
(root / 'src/assets/Manrope-LICENSE.txt').write_text((root / 'node_modules/@fontsource-variable/manrope/LICENSE').read_text())
