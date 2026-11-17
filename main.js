// Markdown in a right panel — an Agents Hub page plugin (EXTENDING.md, place session.aside, API 1.14).
// A click on a link to an .md file (in the feed, a question card, anywhere on the page) opens the file in a panel to the
// right of the session's conversation: inside is the same "Files" in an embedded window (embed=1: no folder list;
// editing, comments, VS Code as there). The panel width is dragged by its left edge (the hub does that), close — ✕ or
// Esc; ⌘/Ctrl-click — as before, in a new tab. On a narrow screen the panel goes over the feed.
const MD = /\.(md|markdown)$/i;

// UI text: English by default, Russian for a hub whose language is Russian (hub.lang, API 1.25)
const TEXT = {
  en: { newTab: "Open in a new tab", close: "Close the file (Esc)", frame: "File", title: (name) => `File · ${name}` },
  ru: { newTab: "Открыть в новой вкладке", close: "Закрыть файл (Esc)", frame: "Файл", title: (name) => `Файл · ${name}` },
};

let hub = null;
let T = TEXT.en;
let doc = null;    // { url, name, path } — the open file; null — no place, the plugin's panel is empty
let ctx = null;    // the place's ctx at the open session: open() — show the panel

const filesPort = () => String(hub.snapshot()?.files_port || 8788);

// a link to an .md file in "Files": /open?path=… or /#/<root>/<path>; file:///… — into "Files" too
function mdLink(a) {
  if (!a || !a.href) return null;
  let u;
  try { u = new URL(a.href); } catch { return null; }
  if (u.protocol === "file:") {
    const f = new URL(`${location.protocol}//${location.hostname}:${filesPort()}/open`);
    f.searchParams.set("path", decodeURIComponent(u.pathname));
    u = f;
  }
  if (u.hostname !== location.hostname || u.port !== filesPort()) return null;
  if (u.pathname === "/open") {
    const path = u.searchParams.get("path") || "";
    return MD.test(path) ? { url: u, path } : null;
  }
  const [route] = decodeURIComponent(u.hash.slice(1)).split("?");
  return u.pathname === "/" && MD.test(route) ? { url: u, path: route.replace(/^\//, "") } : null;
}

// the embedded window's address: the same file with embed=1 (in the /open query or in the hash)
function embedded(u) {
  const src = new URL(u.href);
  if (src.pathname === "/open") src.searchParams.set("embed", "1");
  else src.hash += (src.hash.includes("?") ? "&" : "?") + "embed=1";
  return src.href;
}

function open(link) {
  doc = { url: link.url.href, src: embedded(link.url), path: link.path, name: link.path.split("/").pop() };
  if (ctx) ctx.open();
  else hub.redraw();
}

function close() {
  if (!doc) return false;
  doc = null;
  hub.redraw();    // the place is empty — no panel (or another plugin is there)
  return true;
}

function button(cls, text, title, onClick) {
  const b = hub.el("button", `btn quiet ${cls}`, text);
  b.type = "button";
  b.title = title;
  b.setAttribute("aria-label", title);
  b.addEventListener("click", onClick);
  return b;
}

function render(root) {
  if (!doc) return root.replaceChildren();
  let frame = root.querySelector("iframe");
  if (!frame) {
    const head = hub.el("div", "mdp-head");
    const name = hub.el("span", "mdp-name");
    const tab = hub.el("a", "btn quiet mdp-tab", "↗");
    tab.target = "_blank";
    tab.rel = "noopener";
    tab.title = T.newTab;
    head.append(name, tab, button("mdp-close", "✕", T.close, close));
    frame = hub.el("iframe", "mdp-frame");
    frame.title = T.frame;
    root.replaceChildren(head, frame);
  }
  root.querySelector(".mdp-name").textContent = doc.name;
  root.querySelector(".mdp-name").title = doc.path;
  root.querySelector(".mdp-tab").href = doc.url;
  if (frame.dataset.src !== doc.src) frame.src = frame.dataset.src = doc.src;   // the same file — do not reload
}

export default function register(h) {
  hub = h;
  T = hub.lang === "ru" ? TEXT.ru : TEXT.en;
  hub.addStyle("md-panel.css");
  hub.addSlot("session.aside", {
    id: "md",
    order: -1,   // the file was just opened — it comes first in the panel
    title: () => (doc ? T.title(doc.name) : ""),
    render(root, snap, c) { ctx = c; root.classList.add("mdp"); render(root); },
  });
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.target.closest?.(".mdp")) return;   // inside the panel itself — as is
    if (!location.hash.startsWith("#/s/")) return;   // the panel belongs to an open session; in other views a link works as before
    const link = mdLink(e.target.closest?.("a"));
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    open(link);
  }, true);
  // Esc closes the file before it stops the session's turn
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.querySelector("dialog[open]") && close()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}
