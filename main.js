// Markdown в панели справа — плагин страницы Agents Hub (EXTENDING.md, место session.aside, API 1.14).
// Клик по ссылке на .md (в ленте, карточке вопроса, где угодно на странице) открывает файл в панели справа от разговора
// сессии: внутри — те же «Файлы» во встроенном окне (embed=1: без списка папки; правка, комментарии, VS Code — как там).
// Ширину панели тянут за левый край (это делает хаб), закрыть — ✕ или Esc; ⌘/Ctrl-клик — как раньше, новой вкладкой.
// На узком экране панель — поверх ленты.
const MD = /\.(md|markdown)$/i;

let hub = null;
let doc = null;    // { url, name, path } — открытый файл; null — места нет, панель плагина пуста
let ctx = null;    // ctx места у открытой сессии: open() — показать панель

const filesPort = () => String(hub.snapshot()?.files_port || 8788);

// ссылка на .md в «Файлах»: /open?path=… или /#/<корень>/<путь>; file:///… — тоже в «Файлы»
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

// адрес встроенного окна: тот же файл с embed=1 (в запросе /open или в хеше)
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
  hub.redraw();    // место пустое — панели нет (или там другой плагин)
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
    tab.title = "Открыть в новой вкладке";
    head.append(name, tab, button("mdp-close", "✕", "Закрыть файл (Esc)", close));
    frame = hub.el("iframe", "mdp-frame");
    frame.title = "Файл";
    root.replaceChildren(head, frame);
  }
  root.querySelector(".mdp-name").textContent = doc.name;
  root.querySelector(".mdp-name").title = doc.path;
  root.querySelector(".mdp-tab").href = doc.url;
  if (frame.dataset.src !== doc.src) frame.src = frame.dataset.src = doc.src;   // тот же файл — не перезагружать
}

export default function register(h) {
  hub = h;
  hub.addStyle("md-panel.css");
  hub.addSlot("session.aside", {
    id: "md",
    order: -1,   // файл открыли только что — он и в панели первым
    title: () => (doc ? `Файл · ${doc.name}` : ""),
    render(root, snap, c) { ctx = c; root.classList.add("mdp"); render(root); },
  });
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (e.target.closest?.(".mdp")) return;   // внутри самой панели — как есть
    if (!location.hash.startsWith("#/s/")) return;   // панель — у открытой сессии; в других видах ссылка как была
    const link = mdLink(e.target.closest?.("a"));
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    open(link);
  }, true);
  // Esc закрывает файл раньше, чем остановит ход сессии
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !document.querySelector("dialog[open]") && close()) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);
}
