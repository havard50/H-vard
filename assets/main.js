(function () {
  var YT_ID = /^[a-zA-Z0-9_-]{11}$/;

  function buildYouTubeSrc(videoId) {
    return (
      "https://www.youtube-nocookie.com/embed/" +
      videoId +
      "?autoplay=1&mute=1&controls=0&loop=1&playlist=" +
      videoId +
      "&modestbranding=1&playsinline=1&rel=0"
    );
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");
  var hasNav = toggle && nav;

  function setOpen(open) {
    if (!hasNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
  }

  if (hasNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      setOpen(!open);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    var navHashLinks = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var sectionIds = navHashLinks
      .map(function (l) {
        return l.getAttribute("href").slice(1);
      })
      .filter(function (id) {
        return id && document.getElementById(id);
      });

    sectionIds.sort(function (a, b) {
      return document.getElementById(a).offsetTop - document.getElementById(b).offsetTop;
    });

    var headerEl = document.querySelector(".site-header");
    function headerHeight() {
      return headerEl ? headerEl.offsetHeight : 64;
    }

    var spyTicking = false;
    function updateNavCurrentSection() {
      var line = headerHeight() + 8;
      var current = sectionIds.length ? sectionIds[0] : "";
      var i;
      var el;
      var top;
      for (i = 0; i < sectionIds.length; i++) {
        el = document.getElementById(sectionIds[i]);
        if (!el) continue;
        top = el.getBoundingClientRect().top;
        if (top <= line) current = sectionIds[i];
      }
      navHashLinks.forEach(function (link) {
        var href = link.getAttribute("href") || "";
        if (href === "#" + current) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      spyTicking = false;
    }

    function onScrollOrResize() {
      if (!spyTicking) {
        spyTicking = true;
        window.requestAnimationFrame(updateNavCurrentSection);
      }
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("load", updateNavCurrentSection);
    updateNavCurrentSection();
  }

  var revealNodes = document.querySelectorAll(".reveal");
  if (revealNodes.length) {
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.14,
          rootMargin: "0px 0px -10% 0px"
        }
      );

      revealNodes.forEach(function (node) {
        revealObserver.observe(node);
      });

      function markRevealsInViewport() {
        var vh = window.innerHeight || document.documentElement.clientHeight || 800;
        revealNodes.forEach(function (node) {
          if (node.classList.contains("in-view")) return;
          var r = node.getBoundingClientRect();
          if (r.top < vh * 0.94 && r.bottom > -vh * 0.2) {
            node.classList.add("in-view");
            revealObserver.unobserve(node);
          }
        });
      }

      markRevealsInViewport();
      window.addEventListener("load", markRevealsInViewport);
    } else {
      revealNodes.forEach(function (node) {
        node.classList.add("in-view");
      });
    }
  }

  var lightbox = document.querySelector("#lightbox");
  var lightboxImage = lightbox ? lightbox.querySelector(".lightbox-image") : null;
  var lightboxCaption = lightbox ? lightbox.querySelector(".lightbox-caption") : null;
  var lightboxClose = lightbox ? lightbox.querySelector(".lightbox-close") : null;
  var lastFocused = null;

  function closeLightbox() {
    if (!lightbox || !lightboxImage || !lightboxCaption) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.removeAttribute("aria-modal");
    document.body.classList.remove("lightbox-open");
    lightboxImage.src = "";
    lightboxImage.alt = "";
    lightboxCaption.textContent = "";
    if (lastFocused) lastFocused.focus();
  }

  if (lightbox && lightboxImage && lightboxCaption) {
    document.querySelectorAll("[data-lightbox='true']").forEach(function (node) {
      node.addEventListener("click", function (event) {
        event.preventDefault();
        var image = node.querySelector("img");
        if (!image) return;
        lastFocused = node;
        lightboxImage.src = image.src;
        lightboxImage.alt = image.alt || "Artist photo preview";
        lightboxCaption.textContent = node.getAttribute("data-caption") || "";
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        lightbox.setAttribute("aria-modal", "true");
        document.body.classList.add("lightbox-open");
        if (lightboxClose) lightboxClose.focus();
      });
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    if (lightboxClose) {
      lightboxClose.addEventListener("click", closeLightbox);
    }
  }

  function closeLightboxIfOpen() {
    if (lightbox && lightbox.classList.contains("is-open")) {
      closeLightbox();
      return true;
    }
    return false;
  }

  window.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (closeLightboxIfOpen()) return;
    if (hasNav) setOpen(false);
  });

  var heroRotationCleanup = null;

  function setupHeroYoutubeRotation(frame) {
    if (heroRotationCleanup) {
      heroRotationCleanup();
      heroRotationCleanup = null;
    }
    if (!frame) return;

    var idsRaw = frame.getAttribute("data-video-ids") || "";
    var videoIds = idsRaw
      .split(",")
      .map(function (id) {
        return id.trim();
      })
      .filter(function (id) {
        return YT_ID.test(id);
      });

    if (videoIds.length) {
      frame.src = buildYouTubeSrc(videoIds[0]);
    }

    if (videoIds.length <= 1) return;

    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var rotationTimer = null;
    var currentIndex = 0;
    var isTransitioning = false;
    var rotateAttr = parseInt(frame.getAttribute("data-rotate-ms") || "16000", 10);
    var rotateMs = Math.min(120000, Math.max(8000, isNaN(rotateAttr) ? 16000 : rotateAttr));

    function stopHeroRotation() {
      if (rotationTimer !== null) {
        window.clearInterval(rotationTimer);
        rotationTimer = null;
      }
    }

    function startHeroRotation() {
      if (videoIds.length <= 1 || reduceMotionMq.matches) return;
      if (rotationTimer !== null) return;
      rotationTimer = window.setInterval(function () {
        if (isTransitioning) return;
        isTransitioning = true;
        currentIndex = (currentIndex + 1) % videoIds.length;
        frame.classList.add("is-fading");

        window.setTimeout(function () {
          frame.src = buildYouTubeSrc(videoIds[currentIndex]);
          window.setTimeout(function () {
            frame.classList.remove("is-fading");
            isTransitioning = false;
          }, 420);
        }, 450);
      }, rotateMs);
    }

    function onReduceMotionChange() {
      if (reduceMotionMq.matches) stopHeroRotation();
      else startHeroRotation();
    }

    startHeroRotation();
    if (typeof reduceMotionMq.addEventListener === "function") {
      reduceMotionMq.addEventListener("change", onReduceMotionChange);
    } else if (typeof reduceMotionMq.addListener === "function") {
      reduceMotionMq.addListener(onReduceMotionChange);
    }

    heroRotationCleanup = function () {
      stopHeroRotation();
      if (typeof reduceMotionMq.removeEventListener === "function") {
        reduceMotionMq.removeEventListener("change", onReduceMotionChange);
      } else if (typeof reduceMotionMq.removeListener === "function") {
        reduceMotionMq.removeListener(onReduceMotionChange);
      }
    };
  }

  setupHeroYoutubeRotation(document.querySelector(".hero-video-frame"));

  var syncAmbientHeroPlayback = function () {};

  (function setupHeroAmbientVideoMotionPrefs() {
    var ambient = document.querySelector(".hero__ambient-video");
    if (!ambient) return;
    var mq = window.matchMedia("(prefers-reduced-motion: reduce)");

    syncAmbientHeroPlayback = function () {
      if (mq.matches) {
        ambient.pause();
        try {
          ambient.currentTime = 0;
        } catch (err) {}
        return;
      }
      var p = ambient.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    };

    syncAmbientHeroPlayback();
    if (typeof mq.addEventListener === "function") mq.addEventListener("change", syncAmbientHeroPlayback);
    else if (typeof mq.addListener === "function") mq.addListener(syncAmbientHeroPlayback);
  })();

  (function initSiteModeToggle() {
    var KEY = "havardpedersen-site-mode";
    var root = document.documentElement;
    var btn = document.querySelector(".site-mode-toggle");
    if (!btn) return;

    function applyMode(mode) {
      var press = mode === "press";
      root.setAttribute("data-site-mode", press ? "press" : "tour");
      try {
        localStorage.setItem(KEY, press ? "press" : "tour");
      } catch (err) {}
      btn.setAttribute("aria-pressed", press ? "true" : "false");
      if (press) {
        btn.textContent = "Tour look";
        btn.setAttribute(
          "aria-label",
          "Switch to dramatic tour and stage colors"
        );
      } else {
        btn.textContent = "Press look";
        btn.setAttribute(
          "aria-label",
          "Switch to calmer press-friendly colors"
        );
      }
    }

    var stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch (err) {}
    if (stored === "press" || stored === "tour") {
      applyMode(stored);
    } else {
      applyMode(root.getAttribute("data-site-mode") || "tour");
    }

    btn.addEventListener("click", function () {
      var isPress = root.getAttribute("data-site-mode") === "press";
      applyMode(isPress ? "tour" : "press");
    });
  })();

  (function initPressKitContactPrefill() {
    var KEY = "havard-press-prefill";
    var links = document.querySelectorAll(
      'a[href="#contact"][data-press-topic]'
    );
    if (!links.length) return;

    function applyPrefill() {
      if (window.location.hash.replace(/^#/, "") !== "contact") return;
      var form = document.querySelector("#contact .contact-form");
      var ta = form && form.querySelector('textarea[name="message"]');
      if (!ta) return;
      var topic = null;
      try {
        topic = sessionStorage.getItem(KEY);
      } catch (err) {}
      if (!topic) return;
      var prefix = "Press request: " + topic + "\n\n";
      try {
        sessionStorage.removeItem(KEY);
      } catch (err) {}
      var v = ta.value.trim();
      if (!v) {
        ta.value = prefix;
      } else if (v.indexOf("Press request:") === -1) {
        ta.value = prefix + ta.value;
      }
      ta.focus();
    }

    links.forEach(function (a) {
      a.addEventListener("click", function () {
        var t = a.getAttribute("data-press-topic");
        if (!t) return;
        try {
          sessionStorage.setItem(KEY, t);
        } catch (err) {}
        window.setTimeout(function () {
          applyPrefill();
        }, 80);
      });
    });

    window.addEventListener("hashchange", applyPrefill);
    window.addEventListener("load", applyPrefill);
  })();

  (function initDynamicContent() {
    var timelineRoot = document.querySelector("#timeline-feed");
    var liveRoot = document.querySelector("#live-gigs");
    var storeRoot = document.querySelector("#store-grid");
    var storeCheckoutStatus = document.querySelector("#store-checkout-status");
    var videoRoot = document.querySelector("#video-feed");
    var partnersRoot = document.querySelector("#partners-grid");
    if (!timelineRoot && !liveRoot && !storeRoot && !videoRoot && !partnersRoot) return;

    function esc(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    function renderLinks(links, className) {
      if (!Array.isArray(links) || !links.length) return "";
      var items = links
        .map(function (link) {
          if (!link || !link.href || !link.label) return "";
          return (
            '<a href="' +
            esc(link.href) +
            '">' +
            esc(link.label) +
            "</a>"
          );
        })
        .filter(Boolean);
      if (!items.length) return "";
      return '<p class="' + className + '">' + items.join(" · ") + "</p>";
    }

    function renderTimeline(items) {
      if (!timelineRoot || !Array.isArray(items) || !items.length) return;
      timelineRoot.innerHTML = items
        .map(function (item) {
          var featuredClass = item && item.featured ? " timeline-card--release" : "";
          return (
            '<article class="news-card timeline-card' +
            featuredClass +
            '">' +
            '<p class="news-card-kicker">' +
            esc(item.kicker) +
            "</p>" +
            '<h3 class="news-card-title">' +
            esc(item.title) +
            "</h3>" +
            '<p class="news-card-text">' +
            esc(item.body) +
            "</p>" +
            renderLinks(item.links, "news-card-links") +
            "</article>"
          );
        })
        .join("");
    }

    function renderLive(items) {
      if (!liveRoot || !Array.isArray(items) || !items.length) return;
      liveRoot.innerHTML = items
        .map(function (item) {
          return (
            "<li>" +
            '<span class="gig-date">' +
            esc(item.date) +
            "</span>" +
            '<span class="gig-meta">' +
            esc(item.meta) +
            "</span>" +
            "</li>"
          );
        })
        .join("");
    }

    function renderStore(items, storeSettings) {
      if (!storeRoot || !Array.isArray(items) || !items.length) return;
      var checkoutEnabled = !!(storeSettings && storeSettings.checkoutEnabled);
      storeRoot.innerHTML = items
        .map(function (item) {
          var primaryAction = item && item.primaryAction && item.primaryAction.href && item.primaryAction.label
            ? '<a class="btn btn-primary btn--compact store-card__action" href="' +
              esc(item.primaryAction.href) +
              '">' +
              esc(item.primaryAction.label) +
              "</a>"
            : "";
          var meta = "";
          if (item && (item.status || item.priceFrom)) {
            meta =
              '<p class="store-card__meta">' +
              (item.status ? '<span class="store-card__status">' + esc(item.status) + "</span>" : "") +
              (item.priceFrom ? '<span class="store-card__price">' + esc(item.priceFrom) + "</span>" : "") +
              "</p>";
          }
          var checkoutAction = "";
          if (
            checkoutEnabled &&
            item &&
            item.checkoutLink &&
            item.checkoutLabel
          ) {
            checkoutAction =
              '<a class="btn btn-ghost btn--compact store-card__checkout" href="' +
              esc(item.checkoutLink) +
              '">' +
              esc(item.checkoutLabel) +
              "</a>";
          }
          var ctaRow = "";
          if (primaryAction || checkoutAction) {
            ctaRow =
              '<div class="store-card__cta-row">' +
              primaryAction +
              checkoutAction +
              "</div>";
          }
          return (
            '<article class="news-card store-card">' +
            '<p class="news-card-kicker">' +
            esc(item.kicker) +
            "</p>" +
            '<h3 class="news-card-title">' +
            esc(item.title) +
            "</h3>" +
            '<p class="news-card-text">' +
            esc(item.body) +
            "</p>" +
            meta +
            ctaRow +
            renderLinks(item.links, "news-card-links") +
            "</article>"
          );
        })
        .join("");
    }

    function renderStoreStatus(storeSettings) {
      if (!storeCheckoutStatus) return;
      if (!storeSettings || typeof storeSettings !== "object") return;
      var provider = esc(storeSettings.provider || "Payment provider");
      var statusText = esc(storeSettings.statusText || "");
      var helpText = storeSettings.helpText
        ? '<span class="store-checkout-help">' + esc(storeSettings.helpText) + "</span>"
        : "";
      storeCheckoutStatus.innerHTML =
        statusText +
        ' <span class="store-checkout-provider">· Planned provider: ' +
        provider +
        "</span> " +
        helpText;
    }

    function renderVideos(items) {
      if (!videoRoot || !Array.isArray(items) || !items.length) return;
      videoRoot.innerHTML = items
        .map(function (item) {
          if (item && item.archiveCard) {
            return (
              '<div class="music-video-card music-video-card--archive">' +
              '<a class="music-video-archive-link" href="' +
              esc(item.href || "#videos") +
              '">' +
              '<span class="music-video-archive-kicker">' +
              esc(item.kicker) +
              "</span>" +
              '<strong class="music-video-archive-title">' +
              esc(item.title) +
              "</strong>" +
              '<span class="music-video-archive-deck">' +
              esc(item.body) +
              "</span>" +
              "</a>" +
              "</div>"
            );
          }
          if (!item || !item.youtubeId || !YT_ID.test(item.youtubeId)) return "";
          return (
            '<div class="music-video-card">' +
            '<div class="music-video-embed">' +
            '<iframe src="https://www.youtube-nocookie.com/embed/' +
            esc(item.youtubeId) +
            '?rel=0&modestbranding=1" title="' +
            esc(item.title || "YouTube video") +
            '" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen"></iframe>' +
            "</div>" +
            '<p class="music-video-caption">' +
            esc(item.caption || "") +
            "</p>" +
            "</div>"
          );
        })
        .filter(Boolean)
        .join("");
    }

    function renderPartners(items) {
      if (!partnersRoot || !Array.isArray(items) || !items.length) return;
      partnersRoot.innerHTML = items
        .map(function (item) {
          var link = item && item.website
            ? '<p class="news-card-links"><a href="' +
              esc(item.website) +
              '">Visit website</a></p>'
            : "";
          var tag = item && item.tag
            ? '<span class="partner-tag">' + esc(item.tag) + "</span>"
            : "";
          return (
            '<article class="news-card partner-card">' +
            '<p class="news-card-kicker">' +
            esc(item.kicker || "Partner") +
            "</p>" +
            '<h3 class="news-card-title">' +
            esc(item.name || "") +
            "</h3>" +
            '<p class="news-card-text">' +
            esc(item.description || "") +
            "</p>" +
            tag +
            link +
            "</article>"
          );
        })
        .join("");
    }

    fetch("assets/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Content fetch failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") return;
        renderTimeline(data.timeline);
        renderLive(data.live);
        renderStore(data.store, data.storeSettings);
        renderStoreStatus(data.storeSettings);
        renderVideos(data.videos);
        renderPartners(data.partners);

        var hb = data.heroBackground;
        var heroFrame = document.querySelector(".hero-video-frame");
        var ambient = document.querySelector(".hero__ambient-video");
        var noteEl = document.querySelector("#hero-bg-note");
        if (hb && typeof hb === "object") {
          if (noteEl && hb.caption) noteEl.textContent = hb.caption;
          if (ambient && hb.posterSrc) ambient.setAttribute("poster", hb.posterSrc);
          if (ambient && hb.ambientMp4) {
            var srcEl = ambient.querySelector('source[type="video/mp4"]');
            if (!srcEl) {
              srcEl = document.createElement("source");
              srcEl.type = "video/mp4";
              ambient.appendChild(srcEl);
            }
            srcEl.src = hb.ambientMp4;
            ambient.load();
          }
          if (heroFrame && Array.isArray(hb.youtubeIds)) {
            var hid = hb.youtubeIds
              .map(function (id) {
                return String(id || "").trim();
              })
              .filter(function (id) {
                return YT_ID.test(id);
              });
            if (hid.length) {
              heroFrame.setAttribute("data-video-ids", hid.join(","));
              if (hb.rotateMs != null && hb.rotateMs !== "") {
                heroFrame.setAttribute("data-rotate-ms", String(hb.rotateMs));
              }
            }
          }
        }
        setupHeroYoutubeRotation(heroFrame);
        syncAmbientHeroPlayback();
      })
      .catch(function () {
        // Keep static fallback content if JSON is unavailable.
      });
  })();
})();
