from pathlib import Path
import base64
import hashlib
import json
import mimetypes
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent
assets, blobs, dimensions = {}, {}, {}
for item in json.loads((root / 'design-reference/asset-manifest.json').read_text()):
    path = root / item['file']
    data = path.read_bytes()
    assert data, f'Empty asset: {path}'
    key = hashlib.sha256(data).hexdigest()[:16]
    mime = 'image/svg+xml' if path.suffix == '.svg' else mimetypes.guess_type(path)[0]
    blobs[key] = f'data:{mime};base64,' + base64.b64encode(data).decode()
    asset_name = item['node'] + '/' + item['key']
    assets[asset_name] = key
    if path.suffix == '.svg':
        node = ET.fromstring(data)
        dimensions[asset_name] = [float(node.attrib['width']), float(node.attrib['height'])]
font = 'data:font/ttf;base64,' + base64.b64encode((root / 'assets/geist.ttf').read_bytes()).decode()
css = (root / 'src/style.css').read_text().replace('__FONT__', font)
script = (root / 'src/app.js').read_text().replace('__ASSETS__', json.dumps({'assets': assets, 'blobs': blobs, 'dimensions': dimensions}, separators=(',', ':')))
html = (root / 'src/shell.html').read_text().replace('__CSS__', css).replace('__JS__', script)
(root / 'index.html').write_text(html)
print(f'Built standalone index.html: {len(html):,} characters; {len(assets)} asset slots; {len(blobs)} unique assets.')
