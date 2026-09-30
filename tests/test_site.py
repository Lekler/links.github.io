"""Integrity checks for the static site; run with Python's standard library."""
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import unittest
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = 'https://links.lekler.com.br/'

class Document(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.elements = []
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        self.elements.append((tag, dict(attrs)))

class SiteTests(unittest.TestCase):
    def setUp(self):
        self.html = (ROOT / 'index.html').read_text()
        self.elements = Document(ROOT / 'index.html').elements

    def test_ids_and_internal_references(self):
        ids = [attrs['id'] for _, attrs in self.elements if 'id' in attrs]
        self.assertEqual(len(ids), len(set(ids)), 'IDs must be unique')
        for _, attrs in self.elements:
            references = []
            if attrs.get('href', '').startswith('#'):
                references.append(attrs['href'][1:])
            for name in ['aria-labelledby', 'aria-describedby', 'aria-controls', 'for']:
                references.extend(attrs.get(name, '').split())
            for reference in references:
                self.assertIn(reference, ids)

    def test_local_assets_exist(self):
        for tag, attrs in self.elements + Document(ROOT / '404.html').elements:
            for name in ['src', 'srcset', 'href']:
                value = attrs.get(name, '')
                if not value or value.startswith('#') or urlsplit(value).scheme:
                    continue
                self.assertTrue((ROOT / ('index.html' if value == '/' else value.lstrip('/'))).is_file(), value)
        for url in re.findall(r'url\("([^\"]+)"\)', (ROOT / 'assets/css/styles.css').read_text()):
            self.assertTrue((ROOT / 'assets/css' / url).is_file(), url)

    def test_links_are_available_without_javascript(self):
        cards = [attrs for tag, attrs in self.elements if tag == 'a' and 'link-card' in attrs.get('class', '').split()]
        self.assertEqual(len(cards), 13)
        self.assertEqual(len({card['href'] for card in cards}), 13)
        required = {
            'https://www.amazon.com.br/shop/lekler', 'https://amzn.to/3WXBeCK',
            'https://lekler.com.br', 'https://github.com/Lekler',
            'https://www.youtube.com/channel/UCz3S1WSkzNvZlS9Zwl2lBQg',
            'https://www.youtube.com/channel/UCfmF6zMTFVRqgxNXiyYGHhQ',
            'https://www.youtube.com/channel/UCdoVWaOnv3TEPVYduuD1h1A',
            'https://www.linkedin.com/in/alexandrerod', 'https://twitch.tv/tiulekler',
            'https://beiradarealidade.com.br', 'https://www.flickr.com/photos/lekler12',
            'https://www.instagram.com/tiulekler', 'https://www.tiktok.com/@lekler',
        }
        self.assertEqual({card['href'] for card in cards}, required)
        for tag, attrs in self.elements:
            if attrs.get('class') == 'link-item':
                self.assertNotIn('hidden', attrs)
            if 'data-enhanced' in attrs:
                self.assertIn('hidden', attrs)

    def test_filters_cover_every_card(self):
        categories = Counter(attrs['data-category'] for _, attrs in self.elements if 'data-category' in attrs)
        filters = {attrs['data-filter'] for _, attrs in self.elements if 'data-filter' in attrs}
        self.assertEqual(filters - {'todos'}, set(categories))
        self.assertEqual(dict(categories), {'recomendo': 2, 'projetos': 3, 'conteudo': 5, 'redes': 3})

    def test_new_tabs_and_affiliates(self):
        for tag, attrs in self.elements:
            if tag == 'a' and attrs.get('target') == '_blank':
                self.assertIn('noopener', attrs.get('rel', '').split())
                self.assertEqual(attrs.get('aria-describedby'), 'new-tab-hint')
            if 'card-featured' in attrs.get('class', '').split():
                self.assertIn('sponsored', attrs['rel'].split())
        self.assertIn('Como associado da Amazon, eu recebo por compras qualificadas.', self.html)

    def test_metadata_and_structured_data(self):
        self.assertIn(('html', {'lang': 'pt-BR'}), self.elements)
        self.assertEqual(sum(tag == 'h1' for tag, _ in self.elements), 1)
        schema = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', self.html, re.S)[1])
        self.assertEqual(schema['url'], CANONICAL)
        self.assertEqual(schema['mainEntity']['alternateName'], 'Lekler')
        image = urlsplit(schema['mainEntity']['image']).path
        self.assertTrue((ROOT / image.lstrip('/')).is_file())
        self.assertTrue(any(attrs.get('rel') == 'canonical' and attrs['href'] == CANONICAL for _, attrs in self.elements))

    def test_sitemap_and_custom_domain(self):
        tree = ET.parse(ROOT / 'sitemap.xml')
        urls = tree.findall('.//{http://www.sitemaps.org/schemas/sitemap/0.9}loc')
        self.assertEqual([item.text for item in urls], [CANONICAL])
        self.assertEqual((ROOT / 'CNAME').read_text().strip(), urlsplit(CANONICAL).hostname)
        self.assertIn(f'Sitemap: {CANONICAL}sitemap.xml', (ROOT / 'robots.txt').read_text())
        self.assertTrue((ROOT / '.nojekyll').is_file())

if __name__ == '__main__':
    unittest.main()
