(() => {
  "use strict";

  const root = document.documentElement;
  const themeButton = document.querySelector("#theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let manualTheme = false;
  try {
    manualTheme = ["light", "dark"].includes(
      localStorage.getItem("lekler-theme"),
    );
  } catch {
    /* Storage is optional. */
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const label = theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro";
    themeButton.setAttribute("aria-label", label);
    themeButton.title = label;
    themeColor.content = theme === "dark" ? "#101714" : "#f5f6f2";
  }
  applyTheme(root.dataset.theme || (systemTheme.matches ? "dark" : "light"));
  themeButton.addEventListener("click", () => {
    const theme = root.dataset.theme === "dark" ? "light" : "dark";
    manualTheme = true;
    applyTheme(theme);
    try {
      localStorage.setItem("lekler-theme", theme);
    } catch {
      /* Keep working for this visit. */
    }
  });
  systemTheme.addEventListener("change", (event) => {
    if (!manualTheme) applyTheme(event.matches ? "dark" : "light");
  });

  const search = document.querySelector("#link-search");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const items = [...document.querySelectorAll(".link-item")];
  const count = document.querySelector("#result-count");
  const empty = document.querySelector("#empty-state");
  const disclosure = document.querySelector("#affiliate-disclosure");
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
  const searchable = new Map(
    items.map((item) => [item, normalize(item.textContent)]),
  );
  let category = "todos";

  function filterLinks() {
    const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    let affiliateVisible = false;
    for (const item of items) {
      const matchesCategory =
        category === "todos" || item.dataset.category === category;
      const matchesQuery = terms.every((term) =>
        searchable.get(item).includes(term),
      );
      item.hidden = !(matchesCategory && matchesQuery);
      if (!item.hidden) {
        visible += 1;
        if (item.dataset.category === "recomendo") affiliateVisible = true;
      }
    }
    empty.hidden = visible !== 0;
    disclosure.hidden = !affiliateVisible;
    count.textContent =
      visible === 1 ? "1 link encontrado" : `${visible} links encontrados`;
  }
  search.addEventListener("input", filterLinks);
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      category = button.dataset.filter;
      filters.forEach((filter) =>
        filter.setAttribute("aria-pressed", String(filter === button)),
      );
      filterLinks();
    }),
  );
  document.querySelector("#reset-filters").addEventListener("click", () => {
    search.value = "";
    category = "todos";
    filters.forEach((filter) =>
      filter.setAttribute(
        "aria-pressed",
        String(filter.dataset.filter === category),
      ),
    );
    filterLinks();
    search.focus();
  });
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const editing =
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    if (
      event.key === "/" &&
      !editing &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      !document.querySelector("dialog[open]")
    ) {
      event.preventDefault();
      search.focus();
    }
    if (event.key === "Escape" && document.activeElement === search) {
      search.value = "";
      filterLinks();
    }
  });

  const toast = document.querySelector("#toast");
  const dialog = document.querySelector("#copy-dialog");
  const copyValue = document.querySelector("#copy-value");
  let toastTimeout;
  function notify(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.classList.add("is-visible");
    toastTimeout = setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.textContent = "";
    }, 4500);
  }
  async function copyText(value, success, title) {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      notify(success);
    } catch {
      document.querySelector("#copy-dialog-title").textContent = title;
      copyValue.value = value;
      dialog.showModal();
      copyValue.focus();
      copyValue.select();
    }
  }
  document
    .querySelector("#share-button")
    .addEventListener("click", async () => {
      const url = document.querySelector('link[rel="canonical"]').href;
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Lekler — links, ideias e projetos",
            url,
          });
          return;
        } catch (error) {
          if (error.name === "AbortError") return;
        }
      }
      await copyText(url, "Link copiado. É só compartilhar!", "Copie o link");
    });
  document.querySelector("#copy-email").addEventListener("click", () => {
    return copyText("blog@lekler.com.br", "E-mail copiado!", "Copie o e-mail");
  });

  document.querySelectorAll("[data-enhanced]").forEach((element) => {
    element.hidden = false;
  });
})();
