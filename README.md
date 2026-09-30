# links.lekler.com.br

Página de links de Alexandre “Lekler” Rodrigues, publicada pelo GitHub Pages em
<https://links.lekler.com.br>.

Site estático, sem etapa de build, sem JavaScript e sem requisições a terceiros:
fontes, ícones e imagens são servidos pelo próprio domínio.

## Estrutura

```text
index.html                 conteúdo da página (links, bio, metadados)
assets/css/styles.css      estilos
assets/fonts/              Space Grotesk (variável) e Chakra Petch 700, subconjunto latin
assets/img/avatar.avif     foto de perfil (384 px); avatar.jpg é o fallback e a imagem de compartilhamento
assets/icons/              favicon SVG e apple-touch-icon
favicon.ico                favicon legado (16 e 32 px)
CNAME                      domínio personalizado do GitHub Pages
.nojekyll                  publica os arquivos como estão, sem processamento Jekyll
```

## Editar links

Cada link é um item de `.links-grid` em `index.html`:

```html
<li>
  <a class="link" href="https://exemplo.com" target="_blank" rel="noopener">
    <span class="link-title">Título</span>
    <span class="link-meta">plataforma ou domínio</span>
    <svg class="link-arrow" aria-hidden="true"><use href="#i-arrow" /></svg>
  </a>
</li>
```

Adicione a classe `featured` ao `<a>` para destacar o card. Ao mudar redes sociais,
atualize também a lista `sameAs` do JSON-LD no `<head>`.

## Visualizar localmente

```sh
python3 -m http.server 8000
```

Depois, abra <http://localhost:8000>.

## Créditos

- Fontes: Space Grotesk e Chakra Petch, SIL Open Font License 1.1
  (`assets/fonts/OFL.txt`).
- Ícones de marca: [Simple Icons](https://simpleicons.org) (CC0 1.0). As marcas
  pertencem aos respectivos titulares.
