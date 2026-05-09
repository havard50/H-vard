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

  var stopHeroVideoRotation = null;

  function bindHeroVideoRotation() {
    if (typeof stopHeroVideoRotation === "function") {
      stopHeroVideoRotation();
      stopHeroVideoRotation = null;
    }
    var heroFrame = document.querySelector(".hero-video-frame");
    if (!heroFrame) return;

    var idsRaw = heroFrame.getAttribute("data-video-ids") || "";
    var videoIds = idsRaw
      .split(",")
      .map(function (id) {
        return id.trim();
      })
      .filter(function (id) {
        return YT_ID.test(id);
      });

    if (videoIds.length) {
      heroFrame.src = buildYouTubeSrc(videoIds[0]);
    }

    if (videoIds.length <= 1) return;

    var reduceMotionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    var rotationTimer = null;
    var currentIndex = 0;
    var isTransitioning = false;
    var rotateAttr = parseInt(heroFrame.getAttribute("data-rotate-ms") || "16000", 10);
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
        heroFrame.classList.add("is-fading");

        window.setTimeout(function () {
          heroFrame.src = buildYouTubeSrc(videoIds[currentIndex]);
          window.setTimeout(function () {
            heroFrame.classList.remove("is-fading");
            isTransitioning = false;
          }, 420);
        }, 450);
      }, rotateMs);
    }

    function onReduceMotionChange() {
      if (reduceMotionMq.matches) stopHeroRotation();
      else startHeroRotation();
    }

    stopHeroVideoRotation = function () {
      stopHeroRotation();
      if (typeof reduceMotionMq.removeEventListener === "function") {
        reduceMotionMq.removeEventListener("change", onReduceMotionChange);
      } else if (typeof reduceMotionMq.removeListener === "function") {
        reduceMotionMq.removeListener(onReduceMotionChange);
      }
    };

    startHeroRotation();
    if (typeof reduceMotionMq.addEventListener === "function") {
      reduceMotionMq.addEventListener("change", onReduceMotionChange);
    } else if (typeof reduceMotionMq.addListener === "function") {
      reduceMotionMq.addListener(onReduceMotionChange);
    }
  }

  function applyHeroBackground(hb) {
    var heroFrame = document.querySelector(".hero-video-frame");
    var poster = document.querySelector(".hero__image");
    var noteEl = document.querySelector("#hero-bg-note");
    if (!heroFrame) return;

    if (hb && typeof hb === "object") {
      if (noteEl && hb.caption) noteEl.textContent = hb.caption;
      if (poster && hb.posterImage) {
        poster.src = hb.posterImage;
        if (hb.posterAlt != null) poster.alt = hb.posterAlt;
      }
      var ids = [];
      if (Array.isArray(hb.youtubeIds) && hb.youtubeIds.length) {
        hb.youtubeIds.forEach(function (id) {
          var t = id != null ? String(id).trim() : "";
          if (YT_ID.test(t)) ids.push(t);
        });
      } else if (hb.youtubeId != null) {
        var one = String(hb.youtubeId).trim();
        if (YT_ID.test(one)) ids.push(one);
      }
      if (ids.length) {
        heroFrame.setAttribute("data-video-ids", ids.join(","));
        if (hb.rotateMs != null && !isNaN(Number(hb.rotateMs))) {
          heroFrame.setAttribute("data-rotate-ms", String(hb.rotateMs));
        }
      }
    }
    bindHeroVideoRotation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindHeroVideoRotation);
  } else {
    bindHeroVideoRotation();
  }

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
    var timelineArchiveRoot = document.querySelector("#timeline-archive-feed");
    var interviewsRoot = document.querySelector("#interviews-feed");
    var liveRoot = document.querySelector("#live-gigs");
    var storeRoot = document.querySelector("#store-grid");
    var storeCheckoutStatus = document.querySelector("#store-checkout-status");
    var videoRoot = document.querySelector("#video-feed");
    var partnersRoot = document.querySelector("#partners-grid");
    var latestUpdatesRoot = document.querySelector("#latest-updates-feed");
    if (
      !timelineRoot &&
      !timelineArchiveRoot &&
      !interviewsRoot &&
      !liveRoot &&
      !storeRoot &&
      !videoRoot &&
      !partnersRoot &&
      !latestUpdatesRoot
    )
      return;

    function esc(value) {
      return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    /** On standalone shop page, in-page hashes must point at the homepage. */
    function resolveHref(href) {
      if (href == null || typeof href !== "string") return href;
      if (href.charAt(0) !== "#") return href;
      if (document.body && document.body.classList.contains("page-shop")) {
        return "/" + href;
      }
      return href;
    }

    function formatPublished(iso) {
      if (!iso || typeof iso !== "string") return "";
      var parsed = Date.parse(iso.length === 10 ? iso + "T12:00:00" : iso);
      if (isNaN(parsed)) return iso;
      return new Date(parsed).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }

    function parseFeedTime(iso) {
      if (!iso || typeof iso !== "string") return 0;
      var t = Date.parse(iso.length === 10 ? iso + "T12:00:00" : iso);
      return isNaN(t) ? 0 : t;
    }

    /** Merge timeline, feedExtras, live (updated), and YouTube rows — newest first for the living feed. */
    function buildLatestUpdates(data) {
      var entries = [];
      var dedupe = Object.create(null);

      function pushEntry(e) {
        if (!e || !e.ts || !e.title) return;
        var key = (e.publishedIso || "") + "|" + e.title + "|" + (e.badge || "");
        if (dedupe[key]) return;
        dedupe[key] = true;
        entries.push(e);
      }

      (data.feedExtras || []).forEach(function (item) {
        if (!item || !item.published) return;
        pushEntry({
          ts: parseFeedTime(item.published),
          publishedIso: item.published,
          badge: item.kicker || "Update",
          title: item.title,
          body: item.body,
          image: item.image,
          imageAlt: item.imageAlt,
          links: item.links,
          defaultHash: "#news"
        });
      });

      (data.timeline || []).forEach(function (item) {
        if (!item || !item.published) return;
        pushEntry({
          ts: parseFeedTime(item.published),
          publishedIso: item.published,
          badge: item.kicker || "News",
          title: item.title,
          body: item.body,
          image: item.image,
          imageAlt: item.imageAlt,
          links: item.links,
          defaultHash: "#news"
        });
      });

      (data.live || []).forEach(function (item) {
        if (!item) return;
        var when = item.updated || item.published;
        if (!when) return;
        pushEntry({
          ts: parseFeedTime(when),
          publishedIso: when,
          badge: "Live",
          title: (item.date || "Shows") + " · routing & dates",
          body: item.meta || "",
          links: item.links,
          defaultHash: "#live"
        });
      });

      (data.videos || []).forEach(function (item) {
        if (!item || item.archiveCard) return;
        if (!item.youtubeId || !YT_ID.test(item.youtubeId)) return;
        var when = item.published || "2020-01-01";
        var watch = "https://www.youtube.com/watch?v=" + item.youtubeId;
        pushEntry({
          ts: parseFeedTime(when),
          publishedIso: when,
          badge: "Video",
          title: item.title || "YouTube",
          body: item.caption || "",
          links: [
            { label: "Watch", href: watch },
            { label: "Video section", href: "#videos" }
          ],
          defaultHash: "#videos"
        });
      });

      entries.sort(function (a, b) {
        return b.ts - a.ts;
      });
      return entries.slice(0, 12);
    }

    function primaryHrefForFeedEntry(e) {
      if (e.links && e.links[0] && e.links[0].href) return e.links[0].href;
      return e.defaultHash || "#news";
    }

    function renderLatestUpdates(items) {
      if (!latestUpdatesRoot || !Array.isArray(items) || !items.length) return;
      latestUpdatesRoot.innerHTML = items
        .map(function (e) {
          var timeHtml =
            e.publishedIso && formatPublished(e.publishedIso)
              ? '<time class="latest-update__time" datetime="' +
                esc(e.publishedIso) +
                '">' +
                esc(formatPublished(e.publishedIso)) +
                "</time>"
              : "";
          var imgHtml =
            e.image && typeof e.image === "string"
              ? '<div class="latest-update__media"><img src="' +
                esc(e.image) +
                '" alt="' +
                esc(e.imageAlt || "") +
                '" loading="lazy" decoding="async" /></div>'
              : "";
          return (
            '<li class="latest-update">' +
            '<div class="latest-update__rail">' +
            timeHtml +
            '<span class="latest-update__badge">' +
            esc(e.badge || "Update") +
            "</span>" +
            "</div>" +
            '<div class="latest-update__main">' +
            '<h3 class="latest-update__title"><a href="' +
            esc(resolveHref(primaryHrefForFeedEntry(e))) +
            '">' +
            esc(e.title) +
            "</a></h3>" +
            '<p class="latest-update__deck">' +
            esc(e.body || "") +
            "</p>" +
            imgHtml +
            renderLinks(e.links, "latest-update__links") +
            "</div>" +
            "</li>"
          );
        })
        .join("");
    }

    function renderLinks(links, className) {
      if (!Array.isArray(links) || !links.length) return "";
      var items = links
        .map(function (link) {
          if (!link || !link.href || !link.label) return "";
          return (
            '<a href="' +
            esc(resolveHref(link.href)) +
            '">' +
            esc(link.label) +
            "</a>"
          );
        })
        .filter(Boolean);
      if (!items.length) return "";
      return '<p class="' + className + '">' + items.join(" · ") + "</p>";
    }

    function timelineArticleHtml(item, archiveVariant) {
      if (!item) return "";
      var featuredClass = item.featured ? " timeline-card--release" : "";
      var archiveClass = archiveVariant ? " timeline-card--archive" : "";
      var published =
        item.published && formatPublished(item.published)
          ? '<p class="timeline-card-date"><time datetime="' +
            esc(item.published) +
            '">' +
            esc(formatPublished(item.published)) +
            "</time></p>"
          : "";
      var media = "";
      if (item.image) {
        media =
          '<div class="timeline-card-media">' +
          '<img src="' +
          esc(item.image) +
          '" alt="' +
          esc(item.imageAlt || "") +
          '" loading="lazy" decoding="async" />' +
          "</div>";
      }
      return (
        '<article class="news-card timeline-card' +
        featuredClass +
        archiveClass +
        '">' +
        published +
        media +
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
    }

    function renderTimeline(items) {
      if (!timelineRoot || !Array.isArray(items) || !items.length) return;
      timelineRoot.innerHTML = items
        .map(function (item) {
          return timelineArticleHtml(item, false);
        })
        .join("");
    }

    function renderTimelineArchive(items) {
      if (!timelineArchiveRoot || !Array.isArray(items) || !items.length) return;
      timelineArchiveRoot.innerHTML = items
        .map(function (item) {
          return timelineArticleHtml(item, true);
        })
        .join("");
    }

    function interviewCardHtml(item) {
      if (!item) return "";
      var media = "";
      if (item.image) {
        var mediaClass = "interview-card-media";
        if (item.imageFit === "cover") {
          mediaClass += " interview-card-media--cover";
        }
        media =
          '<div class="' +
          mediaClass +
          '">' +
          '<img src="' +
          esc(item.image) +
          '" alt="' +
          esc(item.imageAlt || "") +
          '" loading="lazy" decoding="async" />' +
          "</div>";
      }
      var audioBlock = "";
      if (item.audio) {
        audioBlock =
          '<div class="interview-card-audio">' +
          '<audio controls preload="none">' +
          '<source src="' +
          esc(item.audio) +
          '" type="audio/mpeg" />' +
          "</audio>" +
          "</div>";
      }
      return (
        '<article class="news-card interview-card">' +
        media +
        audioBlock +
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
    }

    function renderRecentInterviews(items) {
      if (!interviewsRoot || !Array.isArray(items) || !items.length) return;
      interviewsRoot.innerHTML = items.map(interviewCardHtml).join("");
    }

    function renderLive(items) {
      if (!liveRoot || !Array.isArray(items) || !items.length) return;
      liveRoot.innerHTML = items
        .map(function (item) {
          var links =
            Array.isArray(item.links) && item.links.length
              ? renderLinks(item.links, "gig-row-links")
              : "";
          return (
            "<li>" +
            '<span class="gig-date">' +
            esc(item.date) +
            "</span>" +
            '<span class="gig-meta">' +
            esc(item.meta) +
            "</span>" +
            links +
            "</li>"
          );
        })
        .join("");
    }

    function renderFeedMeta(siteMeta) {
      var el = document.querySelector("#news-feed-meta");
      if (!el || !siteMeta || typeof siteMeta !== "object") return;
      var updated = siteMeta.feedUpdated ? esc(formatPublished(siteMeta.feedUpdated)) : "";
      var note = siteMeta.feedNote ? esc(siteMeta.feedNote) : "";
      if (!updated && !note) return;
      var parts = [];
      if (updated) parts.push("Feed last revised · <time datetime=\"" + esc(siteMeta.feedUpdated) + "\">" + updated + "</time>");
      if (note) parts.push(note);
      el.innerHTML = parts.join(" — ");
      el.removeAttribute("hidden");
    }

    function renderStore(items, storeSettings) {
      if (!storeRoot || !Array.isArray(items) || !items.length) return;
      var checkoutEnabled = !!(storeSettings && storeSettings.checkoutEnabled);
      storeRoot.innerHTML = items
        .map(function (item) {
          var primaryAction = item && item.primaryAction && item.primaryAction.href && item.primaryAction.label
            ? '<a class="btn btn-primary btn--compact store-card__action" href="' +
              esc(resolveHref(item.primaryAction.href)) +
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
              esc(resolveHref(item.checkoutLink)) +
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
          var preview =
            item && item.previewImage
              ? '<div class="store-card__preview"><img src="' +
                esc(item.previewImage) +
                '" alt="' +
                esc(item.previewAlt || item.title || "Product preview") +
                '" loading="lazy" decoding="async" /></div>'
              : "";
          return (
            '<article class="news-card store-card">' +
            preview +
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

    function isNetlifyDeployHost() {
      var h = (location.hostname || "").toLowerCase();
      return h.indexOf("netlify.app") !== -1;
    }

    /**
     * Optional HTTPS action (e.g. Formspree): in-browser POST. Same fields: name, email, message.
     */
    function applyContactForm(contactForm) {
      var form = document.querySelector("#contact .contact-form");
      if (!form) return;
      var cfg = contactForm && typeof contactForm === "object" ? contactForm : null;
      var action = cfg && cfg.action != null ? String(cfg.action).trim() : "";
      if (!action || action.indexOf("https://") !== 0) return;

      form.setAttribute("action", action);
      form.removeAttribute("data-netlify");
      form.removeAttribute("data-netlify-honeypot");

      var note = document.querySelector("#contact-form-provider-note");
      if (note) {
        note.removeAttribute("hidden");
        note.textContent =
          (cfg.note && String(cfg.note).trim()) ||
          "This form posts to the inbox configured in content.json (external provider).";
      }

      if (cfg.subject) {
        var sub = form.querySelector('input[name="_subject"]');
        if (!sub) {
          sub = document.createElement("input");
          sub.type = "hidden";
          sub.name = "_subject";
          form.insertBefore(sub, form.firstChild);
        }
        sub.value = String(cfg.subject);
      }

      if (cfg.redirectThanks) {
        var next = form.querySelector('input[name="_next"]');
        if (!next) {
          next = document.createElement("input");
          next.type = "hidden";
          next.name = "_next";
          form.appendChild(next);
        }
        next.value = String(cfg.redirectThanks);
      }
    }

    /**
     * Free default on one.com / localhost: open the visitor's mail client (no third-party account).
     * Skipped on *.netlify.app where Netlify Forms handle POST when action is not overridden.
     */
    function bindContactFormMailtoFallback(contactForm) {
      var form = document.querySelector("#contact .contact-form");
      if (!form) return;
      if (isNetlifyDeployHost()) return;

      var cfg = contactForm && typeof contactForm === "object" ? contactForm : {};
      var action = cfg.action != null ? String(cfg.action).trim() : "";
      if (action.indexOf("https://") === 0) return;

      form.removeAttribute("data-netlify");
      form.removeAttribute("data-netlify-honeypot");
      form.setAttribute("action", "#");

      var mailto = (cfg.mailto && String(cfg.mailto).trim()) || "havardpedersen@me.com";
      var subj =
        (cfg.subject && String(cfg.subject).trim()) || "Site contact — havardpedersen.com";

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (typeof form.reportValidity === "function" && !form.checkValidity()) {
          form.reportValidity();
          return;
        }
        var fd = new FormData(form);
        var name = (fd.get("name") || "").toString();
        var email = (fd.get("email") || "").toString();
        var message = (fd.get("message") || "").toString();
        var body =
          "Name: " + name + "\r\n" + "Reply-to: " + email + "\r\n\r\n" + message;
        window.location.href =
          "mailto:" + mailto + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
      });

      var note = document.querySelector("#contact-form-provider-note");
      if (note) {
        note.removeAttribute("hidden");
        note.textContent =
          (cfg.mailtoNote && String(cfg.mailtoNote).trim()) ||
          "Free — uses the visitor’s email app (no paid service). Message is addressed to " +
          mailto +
          ".";
      }
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

    fetch("/assets/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Content fetch failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") return;
        renderFeedMeta(data.siteMeta);
        renderLatestUpdates(buildLatestUpdates(data));
        renderTimeline(data.timeline);
        renderTimelineArchive(data.timelineArchive);
        renderRecentInterviews(data.recentInterviews);
        renderLive(data.live);
        renderStore(data.store, data.storeSettings);
        renderStoreStatus(data.storeSettings);
        renderVideos(data.videos);
        renderPartners(data.partners);

        applyHeroBackground(data.heroBackground);
        applyContactForm(data.contactForm);
        bindContactFormMailtoFallback(data.contactForm);
      })
      .catch(function () {
        // Keep static fallback content if JSON is unavailable.
      });
  })();
})();
