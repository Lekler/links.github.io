/* Apply a saved preference before the stylesheet paints. Storage may be blocked. */
(() => {
  let preference;
  try {
    preference = localStorage.getItem("lekler-theme");
  } catch {
    /* Use system preference. */
  }
  const theme =
    preference === "light" || preference === "dark"
      ? preference
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme;
})();
