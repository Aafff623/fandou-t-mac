// README Polish · preview shell · 渲染 README.md + 工具栏交互
(function () {
  "use strict";

  // 配置通过 window.__PREVIEW_README__ 注入（见 preview-readme.html）
  var cfg = window.__PREVIEW_README__ || {};
  var readmeUrl = cfg.readmeUrl || "./README.md";
  var portHint = cfg.portHint || "5189";

  var contentEl = document.getElementById("content");
  var statusEl = document.getElementById("status");
  var reloadBtn = document.getElementById("reloadBtn");

  function setStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.classList.remove("is-error", "is-success");
    if (kind) statusEl.classList.add(kind === "error" ? "is-error" : "is-success");
  }

  function renderMarkdown(text) {
    if (window.marked && typeof window.marked.parse === "function") {
      contentEl.innerHTML = window.marked.parse(text, { mangle: false, headerIds: false });
      return;
    }
    // marked 还没加载：原样包进 <pre>，至少能看
    var pre = document.createElement("pre");
    pre.textContent = text;
    contentEl.innerHTML = "";
    contentEl.appendChild(pre);
  }

  function loadReadme() {
    if (location.protocol === "file:") {
      setStatus(
        "file:// 协议下 fetch 不到 README.md。请在仓库根运行：python -m http.server " +
          portHint +
          "，然后用 http://127.0.0.1:" +
          portHint +
          "/preview-readme.html 打开。",
        "error"
      );
      return;
    }
    setStatus("正在加载 README.md…");
    fetch(readmeUrl + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      })
      .then(function (md) {
        renderMarkdown(md);
        setStatus("README 已渲染（" + new Date().toLocaleString() + "）", "success");
      })
      .catch(function (err) {
        setStatus("加载失败：" + err.message + "。确认端口 " + portHint + " 上的服务还在跑。", "error");
      });
  }

  if (reloadBtn) reloadBtn.addEventListener("click", loadReadme);
  loadReadme();
})();
