# links.lekler.com.br

Página de links de Alexandre “Lekler” Rodrigues, publicada pelo GitHub Pages em
<https://links.lekler.com.br>.

HTML, CSS e JavaScript puro, sem build, frameworks, cookies ou analytics. Fontes,
ícones e imagens são locais. Os links e o conteúdo continuam disponíveis sem
JavaScript; os controles interativos aparecem quando o script está pronto.

## Recursos

- Layout responsivo e temas claro/escuro. A primeira visita acompanha o sistema;
  a escolha manual fica em `localStorage` (`lekler-theme`).
- Busca sem distinção de acentos ou maiúsculas, combinada com filtros por categoria.
  `/` foca a busca e `Esc` limpa o termo, mantendo a categoria.
- Compartilhamento nativo, quando disponível, com cópia do endereço como alternativa.
- Botão para copiar o e-mail. Quando o navegador bloqueia a área de transferência,
  um diálogo permite selecionar e copiar o texto manualmente.
- Navegação por teclado, link para pular ao conteúdo, avisos para leitores de tela,
  indicação de nova aba, contraste e respeito a movimento reduzido.
- Metadados de compartilhamento, JSON-LD, sitemap, robots.txt e página 404.
- Aviso de afiliado e `rel="sponsored"` nos links da Amazon.

## Estrutura

```text
index.html                  conteúdo, links, biografia e metadados
404.html                    página de endereço não encontrado
assets/css/styles.css       layout e temas
assets/js/theme.js          preferência inicial, antes da pintura
assets/js/main.js           busca, filtros, tema, compartilhamento e cópia
assets/fonts/               fontes auto-hospedadas e licenças
assets/img/avatar.avif       retrato otimizado; avatar.jpg é o fallback e imagem social
assets/icons/               favicon SVG e apple-touch-icon
favicon.ico                 favicon legado
robots.txt, sitemap.xml     descoberta pelos mecanismos de busca
CNAME, .nojekyll             configuração existente do GitHub Pages
.github/workflows/checks.yml validação automática de alterações
```

## Editar links

Edite os itens de `#links-grid` diretamente em `index.html`. A busca usa o texto
visível de cada item, sem precisar manter uma segunda lista em JavaScript.

```html
<li class="link-item" data-category="projetos">
  <a
    class="link-card"
    href="https://exemplo.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-describedby="new-tab-hint"
  >
    <span class="card-top">
      <span class="card-icon"
        ><svg class="icon" aria-hidden="true"><use href="#i-globe" /></svg
      ></span>
      <svg class="card-arrow" aria-hidden="true"><use href="#i-arrow" /></svg>
    </span>
    <h3>Título</h3>
    <p class="card-description">Descrição curta.</p>
    <span class="card-domain">exemplo.com</span>
  </a>
</li>
```

Categorias: `conteudo`, `projetos`, `redes`, `recomendo`. Ao acrescentar links,
atualize o contador de “Todos”, o texto inicial de resultados e os testes de
integridade. Para novas categorias, inclua também um botão com `data-filter`.
Nos links de afiliado, use `card-featured` e `rel="noopener noreferrer sponsored"`.
Ao mudar redes sociais, atualize também `sameAs` no JSON-LD.

## Visualizar e validar

```sh
python3 -m http.server 8000
```

Abra <http://localhost:8000>. Não há dependências para instalar. Compartilhamento
e área de transferência dependem das permissões do navegador e de HTTPS ou localhost.
A página 404 usa caminhos a partir da raiz, para o domínio personalizado do `CNAME`.

```sh
python3 -m unittest discover -s tests -v
node --test tests/interactions.test.cjs
node --check assets/js/theme.js
node --check assets/js/main.js
```

Antes de publicar, confira os dois temas em celular e computador, os filtros
combinados com a busca, o estado vazio, a limpeza, o teclado e os botões de cópia.
Os testes automáticos verificam a integridade do site, mas não a disponibilidade
dos serviços externos nem substituem a revisão visual.

## Publicação

O site continua compatível com a configuração existente do GitHub Pages, sem
etapa de compilação. Preserve `CNAME` e `.nojekyll`. A integração na branch
`master` deve seguir a revisão normal do repositório.

## Créditos

- Space Grotesk e Chakra Petch: SIL Open Font License 1.1 (`assets/fonts/OFL.txt`).
  A interface utiliza Space Grotesk; a fonte anterior é preservada no repositório.
- Ícones de marca: [Simple Icons](https://simpleicons.org), CC0 1.0.
  As marcas pertencem aos respectivos titulares.
- Origem: [LinkFree](https://github.com/MichaelBarney/LinkFree).
