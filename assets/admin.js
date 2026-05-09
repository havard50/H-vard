(function () {
  var editor = document.querySelector("#editor");
  var statusEl = document.querySelector("#status");
  var statsEl = document.querySelector("#stats");
  var loadBtn = document.querySelector("#loadBtn");
  var validateBtn = document.querySelector("#validateBtn");
  var copyBtn = document.querySelector("#copyBtn");
  var downloadBtn = document.querySelector("#downloadBtn");

  if (!editor || !statusEl || !statsEl) return;

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#fca5a5" : "#fde68a";
  }

  function renderStats(data) {
    var timelineCount = Array.isArray(data.timeline) ? data.timeline.length : 0;
    var liveCount = Array.isArray(data.live) ? data.live.length : 0;
    var storeCount = Array.isArray(data.store) ? data.store.length : 0;
    var videoCount = Array.isArray(data.videos) ? data.videos.length : 0;
    statsEl.innerHTML =
      "<li>Timeline items: " +
      timelineCount +
      "</li>" +
      "<li>Live entries: " +
      liveCount +
      "</li>" +
      "<li>Store items: " +
      storeCount +
      "</li>" +
      "<li>Video items: " +
      videoCount +
      "</li>";
  }

  function validateEditorContent() {
    try {
      var parsed = JSON.parse(editor.value);
      renderStats(parsed);
      setStatus("Valid JSON. Ready to export.", false);
      return parsed;
    } catch (err) {
      setStatus("Invalid JSON: " + err.message, true);
      return null;
    }
  }

  function loadCurrent() {
    fetch("assets/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load assets/content.json");
        return res.json();
      })
      .then(function (data) {
        editor.value = JSON.stringify(data, null, 2);
        renderStats(data);
        setStatus("Loaded current content.json", false);
      })
      .catch(function (err) {
        setStatus(err.message, true);
      });
  }

  loadBtn && loadBtn.addEventListener("click", loadCurrent);
  validateBtn &&
    validateBtn.addEventListener("click", function () {
      validateEditorContent();
    });

  copyBtn &&
    copyBtn.addEventListener("click", function () {
      var parsed = validateEditorContent();
      if (!parsed) return;
      navigator.clipboard
        .writeText(editor.value)
        .then(function () {
          setStatus("Copied JSON to clipboard.", false);
        })
        .catch(function () {
          setStatus("Copy failed. Select and copy manually.", true);
        });
    });

  downloadBtn &&
    downloadBtn.addEventListener("click", function () {
      var parsed = validateEditorContent();
      if (!parsed) return;
      var blob = new Blob([editor.value], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "content.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("Downloaded content.json", false);
    });

  loadCurrent();
})();
