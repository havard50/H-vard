(function () {
  var editor = document.querySelector("#editor");
  var statusEl = document.querySelector("#status");
  var statsEl = document.querySelector("#stats");
  var loadBtn = document.querySelector("#loadBtn");
  var validateBtn = document.querySelector("#validateBtn");
  var stampFeedDateBtn = document.querySelector("#stampFeedDateBtn");
  var copyBtn = document.querySelector("#copyBtn");
  var downloadBtn = document.querySelector("#downloadBtn");

  if (!editor || !statusEl || !statsEl) return;

  function setStatus(message, isError, isWarn) {
    statusEl.textContent = message;
    if (isError) statusEl.style.color = "#fca5a5";
    else if (isWarn) statusEl.style.color = "#fcd34d";
    else statusEl.style.color = "#fde68a";
  }

  function collectWarnings(data) {
    var w = [];
    if (!data || typeof data !== "object") return w;

    (Array.isArray(data.timeline) ? data.timeline : []).forEach(function (item, i) {
      if (!item || !item.published) w.push("timeline[" + i + "] missing `published` (needed for sort + feed merge)");
    });

    (Array.isArray(data.feedExtras) ? data.feedExtras : []).forEach(function (item, i) {
      if (!item || !item.published) w.push("feedExtras[" + i + "] missing `published`");
    });

    (Array.isArray(data.live) ? data.live : []).forEach(function (item, i) {
      if (!item || !item.updated) w.push("live[" + i + "] missing `updated` (feed + static copy use it)");
    });

    (Array.isArray(data.store) ? data.store : []).forEach(function (item, i) {
      if (item && !item.previewImage) w.push("store[" + i + "] has no `previewImage` (card still works; thumbnail empty)");
    });

    (Array.isArray(data.partners) ? data.partners : []).forEach(function (item, i) {
      if (item && !item.website) w.push("partners[" + i + "] has no `website`");
    });

    (Array.isArray(data.videos) ? data.videos : []).forEach(function (item, i) {
      if (item && !item.archiveCard && !item.youtubeId) {
        w.push("videos[" + i + "] needs `youtubeId` (or set archiveCard: true)");
      }
    });

    return w;
  }

  function renderStats(data) {
    var timelineCount = Array.isArray(data.timeline) ? data.timeline.length : 0;
    var archiveCount = Array.isArray(data.timelineArchive)
      ? data.timelineArchive.length
      : 0;
    var interviewsCount = Array.isArray(data.recentInterviews)
      ? data.recentInterviews.length
      : 0;
    var liveCount = Array.isArray(data.live) ? data.live.length : 0;
    var storeCount = Array.isArray(data.store) ? data.store.length : 0;
    var videoCount = Array.isArray(data.videos) ? data.videos.length : 0;
    var feedExtrasCount = Array.isArray(data.feedExtras) ? data.feedExtras.length : 0;
    var partnersCount = Array.isArray(data.partners) ? data.partners.length : 0;
    var feedUpdated =
      data.siteMeta && data.siteMeta.feedUpdated
        ? "<li>Feed last revised (<code>siteMeta.feedUpdated</code>): " + data.siteMeta.feedUpdated + "</li>"
        : "<li>Feed last revised: <em>set <code>siteMeta.feedUpdated</code> (YYYY-MM-DD)</em></li>";
    statsEl.innerHTML =
      feedUpdated +
      "<li>Timeline items: " +
      timelineCount +
      "</li>" +
      "<li>Timeline archive: " +
      archiveCount +
      "</li>" +
      "<li>Recent interviews: " +
      interviewsCount +
      "</li>" +
      "<li>Live entries: " +
      liveCount +
      "</li>" +
      "<li>Store items: " +
      storeCount +
      "</li>" +
      "<li>Video items: " +
      videoCount +
      "</li>" +
      "<li>Feed extras (living feed): " +
      feedExtrasCount +
      "</li>" +
      "<li>Partners: " +
      partnersCount +
      "</li>";
  }

  function todayIsoLocal() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length === 1) m = "0" + m;
    if (day.length === 1) day = "0" + day;
    return y + "-" + m + "-" + day;
  }

  function validateEditorContent() {
    try {
      var parsed = JSON.parse(editor.value);
      renderStats(parsed);
      var warnings = collectWarnings(parsed);
      if (warnings.length) {
        setStatus("Valid JSON. Warnings:\n" + warnings.map(function (x) { return "— " + x; }).join("\n"), false, true);
      } else {
        setStatus("Valid JSON. Ready to export.", false, false);
      }
      return parsed;
    } catch (err) {
      setStatus("Invalid JSON: " + err.message, true);
      return null;
    }
  }

  function loadCurrent() {
    fetch("/assets/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Could not load assets/content.json");
        return res.json();
      })
      .then(function (data) {
        editor.value = JSON.stringify(data, null, 2);
        renderStats(data);
        var warnings = collectWarnings(data);
        if (warnings.length) {
          setStatus(
            "Loaded current content.json.\nWarnings:\n" + warnings.map(function (x) { return "— " + x; }).join("\n"),
            false,
            true
          );
        } else {
          setStatus("Loaded current content.json", false, false);
        }
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

  stampFeedDateBtn &&
    stampFeedDateBtn.addEventListener("click", function () {
      var parsed = validateEditorContent();
      if (!parsed) return;
      if (!parsed.siteMeta || typeof parsed.siteMeta !== "object") parsed.siteMeta = {};
      var iso = todayIsoLocal();
      parsed.siteMeta.feedUpdated = iso;
      editor.value = JSON.stringify(parsed, null, 2);
      validateEditorContent();
      setStatus("Set siteMeta.feedUpdated to " + iso + " (local date). Download or copy, then upload content.json.", false, false);
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
