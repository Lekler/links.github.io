const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");

// Minimal DOM ports let us exercise denied browser capabilities without requiring
// permissions, sending a share, or changing the real clipboard in CI.
function page(options = {}) {
  let document;
  class Element {
    constructor(data = {}) {
      Object.assign(
        this,
        {
          dataset: {},
          attributes: {},
          listeners: {},
          textContent: "",
          value: "",
          hidden: false,
          tagName: "BUTTON",
        },
        data,
      );
      this.classList = { add() {}, remove() {} };
    }
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
    addEventListener(name, handler) {
      this.listeners[name] = handler;
    }
    focus() {
      document.activeElement = this;
    }
    select() {
      this.selected = true;
    }
    showModal() {
      this.open = true;
    }
    async dispatch(name, event = {}) {
      return this.listeners[name]?.(event);
    }
  }
  const nodes = Object.fromEntries(
    [
      "#theme-toggle",
      'meta[name="theme-color"]',
      "#link-search",
      "#result-count",
      "#empty-state",
      "#affiliate-disclosure",
      "#reset-filters",
      "#toast",
      "#copy-dialog",
      "#copy-value",
      "#copy-dialog-title",
      "#share-button",
      "#copy-email",
      'link[rel="canonical"]',
    ].map((id) => [id, new Element()]),
  );
  nodes["#link-search"].tagName = "INPUT";
  nodes['link[rel="canonical"]'].href = "https://links.lekler.com.br/";
  const root = new Element();
  const filters = ["todos", "projetos", "conteudo", "recomendo"].map(
    (category) => new Element({ dataset: { filter: category } }),
  );
  const items = [
    new Element({
      dataset: { category: "projetos" },
      textContent: "GitHub Código e projetos abertos",
    }),
    new Element({
      dataset: { category: "conteudo" },
      textContent: "Fotografia Explorações urbanas",
    }),
    new Element({
      dataset: { category: "recomendo" },
      textContent: "Minha loja na Amazon",
    }),
  ];
  const enhanced = [new Element({ hidden: true })];
  const documentListeners = {};
  document = {
    documentElement: root,
    activeElement: null,
    querySelector: (selector) =>
      selector === "dialog[open]"
        ? nodes["#copy-dialog"].open
          ? nodes["#copy-dialog"]
          : null
        : nodes[selector],
    querySelectorAll: (selector) =>
      ({
        "[data-filter]": filters,
        ".link-item": items,
        "[data-enhanced]": enhanced,
      })[selector],
    addEventListener: (name, handler) => {
      documentListeners[name] = handler;
    },
  };
  const stored = new Map(
    options.theme ? [["lekler-theme", options.theme]] : [],
  );
  const writes = [];
  const system = {
    matches: options.darkSystem ?? false,
    addEventListener(name, handler) {
      this.onChange = handler;
    },
  };
  const context = vm.createContext({
    document,
    HTMLElement: Element,
    window: { matchMedia: () => system },
    localStorage: {
      getItem: (key) => {
        if (options.blockStorage) throw new Error("blocked");
        return stored.get(key);
      },
      setItem: (key, value) => {
        if (options.blockStorage) throw new Error("blocked");
        stored.set(key, value);
      },
    },
    navigator: {
      share: options.share,
      clipboard: options.noClipboard
        ? undefined
        : {
            writeText: async (text) => {
              if (options.blockClipboard) throw new Error("denied");
              writes.push(text);
            },
          },
    },
    setTimeout: () => 1,
    clearTimeout: () => {},
  });
  for (const file of ["theme.js", "main.js"])
    vm.runInContext(
      readFileSync(join(__dirname, "../assets/js", file), "utf8"),
      context,
    );
  return {
    nodes,
    root,
    filters,
    items,
    enhanced,
    stored,
    writes,
    system,
    document,
    documentListeners,
  };
}

test("blocked storage keeps controls usable and applies the chosen theme in memory", async () => {
  const p = page({ blockStorage: true, darkSystem: true });
  assert.equal(p.root.dataset.theme, "dark");
  await p.nodes["#theme-toggle"].dispatch("click");
  assert.equal(p.root.dataset.theme, "light");
  assert.equal(
    p.nodes["#theme-toggle"].attributes["aria-label"],
    "Ativar tema escuro",
  );
  assert.equal(p.enhanced[0].hidden, false);
});

test("saved preference wins over system changes; automatic mode follows them", () => {
  const manual = page({ theme: "light", darkSystem: true });
  manual.system.onChange({ matches: true });
  assert.equal(manual.root.dataset.theme, "light");
  const automatic = page();
  automatic.system.onChange({ matches: true });
  assert.equal(automatic.root.dataset.theme, "dark");
});

test("search ignores accents and case and combines all terms with the category", async () => {
  const p = page();
  p.nodes["#link-search"].value = " CODIGO abertos ";
  await p.nodes["#link-search"].dispatch("input");
  assert.deepEqual(
    p.items.map((item) => item.hidden),
    [false, true, true],
  );
  assert.equal(p.nodes["#result-count"].textContent, "1 link encontrado");
  await p.filters[2].dispatch("click");
  assert.equal(p.nodes["#empty-state"].hidden, false);
  assert.equal(p.nodes["#affiliate-disclosure"].hidden, true);
  await p.nodes["#reset-filters"].dispatch("click");
  assert.deepEqual(
    p.items.map((item) => item.hidden),
    [false, false, false],
  );
  assert.equal(p.nodes["#affiliate-disclosure"].hidden, false);
  assert.equal(p.document.activeElement, p.nodes["#link-search"]);
});

test("unavailable native sharing copies the canonical public URL", async () => {
  const p = page();
  await p.nodes["#share-button"].dispatch("click");
  assert.deepEqual(p.writes, ["https://links.lekler.com.br/"]);
  assert.match(p.nodes["#toast"].textContent, /Link copiado/);
});

test("a rejected native share falls back to copying", async () => {
  const p = page({
    share: async () => {
      throw new Error("unsupported");
    },
  });
  await p.nodes["#share-button"].dispatch("click");
  assert.deepEqual(p.writes, ["https://links.lekler.com.br/"]);
});

test("cancelling native sharing leaves the clipboard alone", async () => {
  const p = page({
    share: async () => {
      throw Object.assign(new Error("cancelled"), { name: "AbortError" });
    },
  });
  await p.nodes["#share-button"].dispatch("click");
  assert.deepEqual(p.writes, []);
  assert.equal(p.nodes["#copy-dialog"].open, undefined);
});

test("denied or unavailable clipboard opens a selectable manual fallback", async () => {
  for (const option of [{ blockClipboard: true }, { noClipboard: true }]) {
    const p = page(option);
    await p.nodes["#share-button"].dispatch("click");
    assert.equal(p.nodes["#copy-dialog"].open, true);
    assert.equal(p.nodes["#copy-value"].value, "https://links.lekler.com.br/");
    assert.equal(p.nodes["#copy-value"].selected, true);
    assert.equal(p.document.activeElement, p.nodes["#copy-value"]);
  }
});

test("copy email reports success only after writing the address", async () => {
  const p = page();
  await p.nodes["#copy-email"].dispatch("click");
  assert.deepEqual(p.writes, ["blog@lekler.com.br"]);
  assert.equal(p.nodes["#toast"].textContent, "E-mail copiado!");
});

test("slash shortcut does not interrupt typing or a modal", () => {
  const p = page();
  let prevented = false;
  const event = {
    key: "/",
    target: p.nodes["#link-search"],
    preventDefault: () => {
      prevented = true;
    },
  };
  p.documentListeners.keydown(event);
  assert.equal(prevented, false);
  event.target = p.nodes["#theme-toggle"];
  p.nodes["#copy-dialog"].open = true;
  p.documentListeners.keydown(event);
  assert.equal(prevented, false);
  p.nodes["#copy-dialog"].open = false;
  p.documentListeners.keydown(event);
  assert.equal(prevented, true);
  assert.equal(p.document.activeElement, p.nodes["#link-search"]);
});
