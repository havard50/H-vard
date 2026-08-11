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
  var nav = document.querySelector("#site-nav") || document.querySelector("#site-nav-mobile");
  var navBackdrop = document.querySelector("#site-nav-backdrop");
  var hasNav = toggle && nav;

  function setOpen(open) {
    if (!hasNav) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
    if (navBackdrop) {
      navBackdrop.hidden = !open;
      navBackdrop.setAttribute("aria-hidden", open ? "false" : "true");
    }
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

    if (navBackdrop) {
      navBackdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        toggle.focus();
      }
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

    function updateHeaderScroll() {
      if (!headerEl) return;
      headerEl.classList.toggle("is-scrolled", window.scrollY > 12);
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
      updateHeaderScroll();
      if (!spyTicking) {
        spyTicking = true;
        window.requestAnimationFrame(updateNavCurrentSection);
      }
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    window.addEventListener("load", function () {
      updateHeaderScroll();
      updateNavCurrentSection();
    });
    updateHeaderScroll();
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
    document.addEventListener("click", function (event) {
      var node = event.target.closest("[data-lightbox='true']");
      if (!node) return;
      event.preventDefault();
      var image = node.querySelector("img");
      if (!image) return;
      lastFocused = node;
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt || "Artist photo preview";
      var cap = (node.getAttribute("data-caption") || "").trim();
      lightboxCaption.textContent = cap || (image.alt || "").trim() || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightbox.setAttribute("aria-modal", "true");
      document.body.classList.add("lightbox-open");
      if (lightboxClose) lightboxClose.focus();
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
    if (!poster && !heroFrame) return;

    if (hb && typeof hb === "object") {
      if (noteEl) {
        noteEl.textContent = hb.caption != null && String(hb.caption).trim() ? String(hb.caption).trim() : "";
      }
      if (poster && hb.posterImage) {
        poster.src = hb.posterImage;
        if (hb.posterAlt != null) poster.alt = hb.posterAlt;
      }
      if (!heroFrame) return;
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
    var showsRoot = document.querySelector("#shows-grid");
    var storeRoot = document.querySelector("#store-grid");
    var storeCheckoutStatus = document.querySelector("#store-checkout-status");
    var videoRoot = document.querySelector("#video-feed");
    var partnersRoot = document.querySelector("#partners-grid");
    var latestUpdatesRoot = document.querySelector("#latest-updates-feed");
    var merchFeature = document.getElementById("merch-feature");
    var featuredShowRoot = document.getElementById("featured-show-root");
    var featuredSection = document.getElementById("featured");
    var socialLinksRoot = document.getElementById("social-links-root");
    var footerSocialRoot = document.getElementById("footer-social-links");
    var pressHistoryRoot = document.getElementById("press-history-root");
    var credibilityGroupsRoot = document.getElementById("credibility-groups");
    var pressArchiveIntroRoot = document.getElementById("press-archive-intro");
    if (
      !timelineRoot &&
      !timelineArchiveRoot &&
      !interviewsRoot &&
      !liveRoot &&
      !showsRoot &&
      !storeRoot &&
      !videoRoot &&
      !partnersRoot &&
      !latestUpdatesRoot &&
      !merchFeature &&
      !featuredShowRoot &&
      !socialLinksRoot &&
      !footerSocialRoot &&
      !pressHistoryRoot &&
      !credibilityGroupsRoot &&
      !pressArchiveIntroRoot
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
        if (item.date === "Poster") return;
        var when = item.updated || item.published;
        if (!when) return;
        pushEntry({
          ts: parseFeedTime(when),
          publishedIso: when,
          badge: "Live",
          title: (item.date || "Shows") + " · routing & dates",
          body: item.meta || "",
          links: item.links,
          defaultHash: "#shows"
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
            { label: "Video section", href: "#video" }
          ],
          defaultHash: "#video"
        });
      });

      entries.sort(function (a, b) {
        return b.ts - a.ts;
      });
      return entries.slice(0, 12);
    }

    function primaryHrefForFeedEntry(e) {
      if (e.links && e.links.length) {
        for (var i = 0; i < e.links.length; i++) {
          if (isVerifiedPublicLink(e.links[i])) return e.links[i].href;
        }
      }
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

    function isDeadLegacyHref(href) {
      if (!href || typeof href !== "string") return false;
      var h = href.toLowerCase();
      return (
        h.indexOf("interviews.html") !== -1 ||
        h.indexOf("reviews.html") !== -1 ||
        h.indexOf("news.html") !== -1
      );
    }

    function isVerifiedPublicLink(link) {
      if (!link || !link.href || !link.label) return false;
      if (link.verifiedLink === false) return false;
      if (isDeadLegacyHref(link.href)) return false;
      return true;
    }

    function renderLinks(links, className) {
      if (!Array.isArray(links) || !links.length) return "";
      var items = links
        .map(function (link) {
          if (!link || !link.label) return "";
          if (!isVerifiedPublicLink(link)) {
            return '<span class="link-plain">' + esc(link.label) + "</span>";
          }
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

    function filterHomepageNews(items, fromYear) {
      if (!Array.isArray(items)) return [];
      var minYear = typeof fromYear === "number" ? fromYear : 2025;
      return items.filter(function (item) {
        if (!item || !item.published) return false;
        var year = parseInt(String(item.published).slice(0, 4), 10);
        return !isNaN(year) && year >= minYear;
      });
    }

    function isHomepageLayout() {
      return document.body && document.body.classList.contains("body--home");
    }

    function bindHomeChrome() {
      if (!isHomepageLayout()) return;
      var header = document.getElementById("site-header");
      if (header) {
        function onScroll() {
          header.classList.toggle("is-scrolled", window.scrollY > 48);
          header.classList.toggle("is-over-hero", window.scrollY < window.innerHeight * 0.5);
        }
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
      }
      var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var reveals = document.querySelectorAll(".home-reveal");
      if (reduced) {
        reveals.forEach(function (el) {
          el.classList.add("is-visible");
        });
        return;
      }
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-visible");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.08, rootMargin: "0px 0px -5% 0px" }
        );
        reveals.forEach(function (el) {
          io.observe(el);
        });
      } else {
        reveals.forEach(function (el) {
          el.classList.add("is-visible");
        });
      }
    }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", bindHomeChrome);
    } else {
      bindHomeChrome();
    }

    function renderPressHistory(items, pressArchive) {
      var root = document.getElementById("press-history-root");
      if (!root || !Array.isArray(items) || !items.length) return;
      var displayItems = items.slice();
      if (isHomepageLayout() && pressArchive && Array.isArray(pressArchive.sections)) {
        var hasBlast = displayItems.some(function (item) {
          return item && String(item.outlet || "").toLowerCase().indexOf("blast") !== -1;
        });
        if (!hasBlast) {
          pressArchive.sections.forEach(function (section) {
            (section.items || []).forEach(function (item) {
              if (!item || !item.title) return;
              if (String(item.title).toLowerCase().indexOf("blast radio") !== -1) {
                displayItems.push({ period: "2011", outlet: "BLAST RADIO UK" });
              }
            });
          });
        }
      }
      if (isHomepageLayout()) {
        root.innerHTML =
          '<ul class="home-archive-list">' +
          displayItems
            .map(function (item) {
              if (!item) return "";
              return (
                "<li><span class=\"period\">" +
                esc(item.period || "") +
                "</span><span>" +
                esc(item.outlet || item.title || "") +
                "</span></li>"
              );
            })
            .filter(Boolean)
            .join("") +
          "</ul>";
        return;
      }
      root.innerHTML =
        '<ol class="press-history-list">' +
        displayItems
          .map(function (item) {
            if (!item) return "";
            return (
              "<li class=\"press-history-item\">" +
              (item.period
                ? '<span class="press-history-period">' + esc(item.period) + "</span>"
                : "") +
              '<span class="press-history-outlet">' +
              esc(item.outlet || item.title || "") +
              "</span>" +
              (item.body ? '<p class="press-history-body">' + esc(item.body) + "</p>" : "") +
              "</li>"
            );
          })
          .filter(Boolean)
          .join("") +
        "</ol>";
    }

    function renderCredibilityGroups(groups) {
      var root = document.getElementById("credibility-groups");
      if (!root || !Array.isArray(groups) || !groups.length) return;
      if (isHomepageLayout()) {
        root.innerHTML = groups
          .map(function (group) {
            if (!group || !group.label || !Array.isArray(group.items) || !group.items.length) return "";
            return (
              '<div class="home-cred-col">' +
              "<h3>" +
              esc(group.label) +
              "</h3>" +
              "<p>" +
              group.items
                .map(function (name) {
                  return esc(name);
                })
                .join("<br />") +
              "</p></div>"
            );
          })
          .filter(Boolean)
          .join("");
        return;
      }
      root.innerHTML = groups
        .map(function (group) {
          if (!group || !group.label || !Array.isArray(group.items) || !group.items.length) return "";
          return (
            '<div class="credibility-group">' +
            '<h3 class="credibility-group__label">' +
            esc(group.label) +
            "</h3>" +
            '<p class="credibility-group__items">' +
            group.items.map(function (name) {
              return esc(name);
            }).join(" · ") +
            "</p></div>"
          );
        })
        .filter(Boolean)
        .join("");
    }

    function renderHomepageTrio(trio) {
      var root = document.getElementById("trio-feature-root");
      if (!root || !trio || typeof trio !== "object") return;
      var posterImg = document.querySelector(".home-trio__media img");
      if (posterImg && trio.poster) {
        posterImg.src = trio.poster;
        if (trio.posterAlt) posterImg.alt = trio.posterAlt;
        if (trio.posterWidth) posterImg.width = trio.posterWidth;
        if (trio.posterHeight) posterImg.height = trio.posterHeight;
      }
      var lineupHtml = "";
      if (Array.isArray(trio.lineup) && trio.lineup.length) {
        lineupHtml =
          '<ul class="' +
          (isHomepageLayout() ? "home-trio__lineup" : "trio-feature__lineup") +
          '" aria-label="Lineup">' +
          trio.lineup
            .map(function (person) {
              if (isHomepageLayout()) {
                return (
                  "<li><strong>" +
                  esc(person.name) +
                  "</strong><span>" +
                  esc(person.role) +
                  "</span></li>"
                );
              }
              return (
                "<li><strong>" +
                esc(person.name) +
                "</strong> — " +
                esc(person.role) +
                "</li>"
              );
            })
            .join("") +
          "</ul>";
      }
      var billing = trio.billing || "HÅVARD PEDERSEN TRIO";
      var featMatch = billing.match(/^(.+?)\s+feat\.\s+(.+)$/i);
      var headline;
      var headlineClass = isHomepageLayout() ? "home-trio__headline" : "trio-feature__headline";
      var nameClass = isHomepageLayout() ? "home-trio__name" : "trio-feature__name";
      var featLabelClass = isHomepageLayout() ? "home-trio__feat-label" : "trio-feature__feat-label";
      var featNamesClass = isHomepageLayout() ? "home-trio__feat-names" : "trio-feature__feat-names";
      if (featMatch) {
        var featParts = featMatch[2].split(/\s+&\s+/);
        var featHtml = esc(featParts[0]);
        if (featParts.length > 1) {
          featHtml += "<br />&<br />" + esc(featParts.slice(1).join(" & "));
        }
        headline =
          '<span class="' +
          nameClass +
          '">' +
          esc(featMatch[1]) +
          "</span>" +
          '<span class="' +
          featLabelClass +
          '">feat.</span>' +
          '<span class="' +
          featNamesClass +
          '">' +
          featHtml +
          "</span>";
      } else {
        headline = esc(billing);
      }
      var introClass = isHomepageLayout() ? "home-trio__intro" : "trio-feature__intro";
      var bodyClass = isHomepageLayout() ? "home-trio__body" : "trio-feature__body";
      var taglineClass = isHomepageLayout() ? "home-trio__tagline" : "trio-feature__tagline";
      var ctaClass = isHomepageLayout() ? "home-trio__cta" : "trio-feature__cta";
      var btnClass = isHomepageLayout() ? "home-btn home-btn--ghost" : "btn btn-ghost";
      root.innerHTML =
        (isHomepageLayout() ? "" : '<div class="trio-feature__copy">') +
        '<h2 id="trio-title" class="' +
        headlineClass +
        '">' +
        headline +
        "</h2>" +
        (trio.intro ? '<p class="' + introClass + '">' + esc(trio.intro) + "</p>" : "") +
        (trio.body
          ? '<p class="' + bodyClass + '">' + esc(trio.body).replace(/\n/g, "<br />") + "</p>"
          : "") +
        (trio.lineupParagraph
          ? '<p class="' + bodyClass + '">' + esc(trio.lineupParagraph) + "</p>"
          : "") +
        lineupHtml +
        (trio.tagline
          ? '<p class="' +
            taglineClass +
            '">' +
            esc(trio.tagline).replace(/\. /g, ".<br />") +
            "</p>"
          : "") +
        '<p class="' +
        ctaClass +
        '"><a class="' +
        btnClass +
        '" href="/live.html">SEE LIVE DATES</a></p>' +
        (isHomepageLayout() ? "" : "</div>");
      root.setAttribute("aria-busy", "false");
    }

    function renderHeroNextShow(upcoming) {
      var root = document.getElementById("hero-next-show");
      if (!root) return;
      var event = getNextFeaturedEvent(upcoming);
      if (!event) {
        root.hidden = true;
        root.innerHTML = "";
        return;
      }
      var parts = eventDateParts(event.date);
      var day = parts && parts.day ? parts.day : "";
      var month = parts && parts.month ? String(parts.month).toUpperCase() : "";
      var year = parts && parts.year ? parts.year : "";
      var venue = (event.venue || "").toUpperCase();
      var city = (event.city || "").toUpperCase();
      var time = event.time ? String(event.time) : "";
      root.hidden = false;
      if (isHomepageLayout()) {
        root.innerHTML =
          '<a class="home-hero__next-link" href="#shows">' +
          '<span class="home-hero__next-kicker">Next show</span>' +
          '<span class="home-hero__next-date">' +
          esc(day) +
          (month ? ' <span class="home-hero__next-month">' + esc(month) + "</span>" : "") +
          (year ? ' <span class="home-hero__next-year">' + esc(year) + "</span>" : "") +
          "</span>" +
          '<span class="home-hero__next-venue">' +
          esc(venue) +
          "</span>" +
          '<span class="home-hero__next-meta">' +
          esc(city) +
          (time ? " · " + esc(time) : "") +
          "</span></a>";
      } else {
        var line =
          (day && month ? day + " " + month : "") +
          (year ? " " + year : "") +
          " · " +
          venue +
          (city ? " · " + city : "") +
          (time ? " · " + time : "");
        root.innerHTML = 'NEXT SHOW — <a href="#shows">' + esc(line.trim()) + "</a>";
      }
    }

    function timelineEditorialHtml(item) {
      if (!item) return "";
      var date =
        item.published && formatPublished(item.published)
          ? formatPublished(item.published)
          : "";
      var excerpt = item.body ? String(item.body) : "";
      if (excerpt.length > 120) {
        excerpt = excerpt.slice(0, 117).replace(/\s+\S*$/, "") + "…";
      }
      var body =
        '<h3>' +
        esc(item.title) +
        "</h3>" +
        (excerpt ? "<p>" + esc(excerpt) + "</p>" : "");
      var href = "";
      if (Array.isArray(item.links)) {
        for (var li = 0; li < item.links.length; li++) {
          var link = item.links[li];
          if (!link || !link.href || isDeadLegacyHref(link.href)) continue;
          if (link.href.charAt(0) === "#" || link.href.charAt(0) === "/") {
            href = resolveHref(link.href);
            break;
          }
          if (isVerifiedPublicLink(link)) {
            href = resolveHref(link.href);
            break;
          }
        }
      }
      if (href) {
        return (
          '<a class="home-news-item" href="' +
          esc(href) +
          '">' +
          (date
            ? '<time datetime="' + esc(item.published) + '">' + esc(date) + "</time>"
            : "<span></span>") +
          "<div>" +
          body +
          "</div></a>"
        );
      }
      return (
        '<article class="home-news-item">' +
        (date
          ? '<time datetime="' + esc(item.published) + '">' + esc(date) + "</time>"
          : "<span></span>") +
        "<div>" +
        body +
        "</div></article>"
      );
    }

    function timelineArticleHtml(item, archiveVariant) {
      if (!item) return "";
      var featuredClass = item.featured ? " timeline-card--release" : "";
      var archiveClass = archiveVariant ? " timeline-card--archive" : "";
      var editorialClass = archiveVariant ? "" : " news-item--editorial";
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
        editorialClass +
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

    function renderTimeline(items, opts) {
      if (!timelineRoot || !Array.isArray(items) || !items.length) return;
      opts = opts || {};
      var sorted = items.slice().sort(function (a, b) {
        var tb = parseFeedTime((b && b.published) || "");
        var ta = parseFeedTime((a && a.published) || "");
        return tb - ta;
      });
      if (opts.limit > 0) sorted = sorted.slice(0, opts.limit);
      if (isHomepageLayout()) {
        timelineRoot.innerHTML = sorted
          .map(function (item) {
            return timelineEditorialHtml(item);
          })
          .join("");
      } else {
        timelineRoot.innerHTML = sorted
          .map(function (item) {
            return timelineArticleHtml(item, false);
          })
          .join("");
      }
      timelineRoot.setAttribute("aria-busy", "false");
    }

    function buildSocialFollowEntries(social) {
      if (!social || typeof social !== "object") return [];
      var entries = [];
      if (social.instagramPrimary && social.instagramPrimary.href) {
        entries.push({
          platform: "Instagram",
          label: social.instagramPrimary.handle || "Instagram",
          note: social.instagramPrimary.label || "Artist / band",
          href: social.instagramPrimary.href
        });
      }
      if (social.instagramPersonal && social.instagramPersonal.href) {
        entries.push({
          platform: "Instagram",
          label: social.instagramPersonal.handle || "Instagram",
          note: social.instagramPersonal.label || "Personal",
          href: social.instagramPersonal.href
        });
      }
      if (social.youtube && social.youtube.href) {
        entries.push({
          platform: "YouTube",
          label: social.youtube.handle || "YouTube",
          href: social.youtube.href
        });
      }
      if (social.spotify && social.spotify.href) {
        entries.push({
          platform: "Spotify",
          label: social.spotify.label || "Spotify",
          href: social.spotify.href
        });
      }
      if (social.tiktok && social.tiktok.href) {
        entries.push({
          platform: "TikTok",
          label: social.tiktok.handle || "TikTok",
          href: social.tiktok.href
        });
      }
      if (social.facebook && social.facebook.href) {
        entries.push({
          platform: "Facebook",
          label: social.facebook.label || "Facebook",
          href: social.facebook.href
        });
      }
      return entries;
    }

    function socialIconSvg(platform) {
      var p = String(platform || "").toLowerCase();
      if (p.indexOf("spotify") !== -1) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>';
      }
      if (p.indexOf("youtube") !== -1) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>';
      }
      if (p.indexOf("instagram") !== -1) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm-5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5zM18 6.3a1.2 1.2 0 1 1-1.2 1.2 1.2 1.2 0 0 1 1.2-1.2z"/></svg>';
      }
      if (p.indexOf("tiktok") !== -1) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M16.5 3h3.2l.1 3.3a7.8 7.8 0 0 0 4.7 2.2V12a10.9 10.9 0 0 1-4.8-1.4v6.8a6.7 6.7 0 1 1-6.7-6.7c.3 0 .7 0 1 .1v3.4a3.4 3.4 0 1 0 2.4 3.2V3z"/></svg>';
      }
      if (p.indexOf("facebook") !== -1) {
        return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.2-1.5 1.5-1.5H17V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2V11H8v3h2.6v8h2.9z"/></svg>';
      }
      return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M14 3h7v7h-2V6.4l-7.8 7.8-1.4-1.4 7.8-7.8H14V3zM5 5h7v2H7v10h10v-5h2v7H5V5z"/></svg>';
    }

    function socialFollowItemHtml(entry) {
      if (!entry || !entry.href) return "";
      if (isHomepageLayout()) {
        var note = entry.note
          ? "<small>" + esc(entry.note) + "</small>"
          : "";
        return (
          '<li><a class="home-social-link" href="' +
          esc(resolveHref(entry.href)) +
          '" rel="noopener noreferrer">' +
          socialIconSvg(entry.platform) +
          "<span>" +
          esc(entry.platform) +
          " — " +
          esc(entry.label) +
          "</span>" +
          note +
          "</a></li>"
        );
      }
      var noteLegacy = entry.note
        ? '<span class="social-follow-note">' + esc(entry.note) + "</span>"
        : "";
      return (
        '<li class="social-follow-item">' +
        '<span class="social-follow-platform">' +
        esc(entry.platform) +
        "</span>" +
        '<a href="' +
        esc(resolveHref(entry.href)) +
        '" rel="noopener noreferrer">' +
        esc(entry.label) +
        "</a>" +
        noteLegacy +
        "</li>"
      );
    }

    function renderSocialLinks(social) {
      if (!socialLinksRoot) return;
      var entries = buildSocialFollowEntries(social);
      if (!entries.length) {
        socialLinksRoot.setAttribute("aria-busy", "false");
        return;
      }
      socialLinksRoot.innerHTML = isHomepageLayout()
        ? '<ul class="home-social-list">' +
          entries.map(socialFollowItemHtml).filter(Boolean).join("") +
          "</ul>"
        : '<ul class="social-follow-list">' +
          entries.map(socialFollowItemHtml).filter(Boolean).join("") +
          "</ul>";
      socialLinksRoot.setAttribute("aria-busy", "false");
    }

    function renderFooterSocial(social) {
      if (!footerSocialRoot || !social) return;
      var parts = [];
      function link(label, href) {
        if (!href) return "";
        return (
          '<a href="' +
          esc(resolveHref(href)) +
          '" rel="noopener noreferrer">' +
          esc(label) +
          "</a>"
        );
      }
      if (social.spotify && social.spotify.href) parts.push(link("Spotify", social.spotify.href));
      if (social.appleMusic && social.appleMusic.href) parts.push(link("Apple Music", social.appleMusic.href));
      if (social.youtube && social.youtube.href) parts.push(link("YouTube", social.youtube.href));
      if (social.instagramPrimary && social.instagramPrimary.href) {
        parts.push(
          link(
            "Instagram — " + (social.instagramPrimary.handle || "artist"),
            social.instagramPrimary.href
          )
        );
      }
      if (social.instagramPersonal && social.instagramPersonal.href) {
        parts.push(
          link(
            "Instagram — " + (social.instagramPersonal.handle || "personal"),
            social.instagramPersonal.href
          )
        );
      }
      if (social.tiktok && social.tiktok.href) parts.push(link("TikTok", social.tiktok.href));
      if (social.facebook && social.facebook.href) parts.push(link("Facebook", social.facebook.href));
      footerSocialRoot.innerHTML = parts.filter(Boolean).join(" · ");
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

    function renderPressArchiveIntro(intro) {
      if (!pressArchiveIntroRoot || !intro) return;
      pressArchiveIntroRoot.textContent = intro;
    }

    function renderPressArchive(pressArchive, recentInterviews) {
      if (!interviewsRoot) return;
      var html = "";
      if (pressArchive && Array.isArray(pressArchive.sections)) {
        pressArchive.sections.forEach(function (section) {
          if (!section) return;
          var sectionItems = (section.items || []).filter(function (item) {
            return item && item.public !== false;
          });
          if (!sectionItems.length) return;
          html +=
            '<div class="press-archive-section"' +
            (section.id ? ' id="' + esc(section.id) + '"' : "") +
            ">";
          if (section.title) {
            html += '<h3 class="interviews-heading">' + esc(section.title) + "</h3>";
          }
          html += '<div class="news-grid interviews-grid">';
          html += sectionItems.map(interviewCardHtml).join("");
          html += "</div></div>";
        });
      }
      var extra = (recentInterviews || []).filter(function (item) {
        return item && item.public !== false;
      });
      if (extra.length) {
        html +=
          '<div class="press-archive-section"><div class="news-grid interviews-grid">' +
          extra.map(interviewCardHtml).join("") +
          "</div></div>";
      }
      interviewsRoot.innerHTML = html;
    }

    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var MONTHS_FULL = [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER"
    ];

    function eventDateParts(iso) {
      if (!iso || typeof iso !== "string") return null;
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
      if (!m) return null;
      var year = m[1];
      var monthIdx = parseInt(m[2], 10) - 1;
      var day = String(parseInt(m[3], 10));
      return {
        year: year,
        month: MONTHS[monthIdx] || m[2],
        day: day,
        iso: iso.trim()
      };
    }

    function endOfEventDay(iso) {
      var parts = eventDateParts(iso);
      if (!parts) return null;
      return new Date(parts.iso + "T23:59:59");
    }

    function eventChronologyKey(event) {
      if (!event || !event.date) return 0;
      var parts = eventDateParts(event.date);
      if (!parts) return 0;
      var time = event.time && /^\d{1,2}:\d{2}$/.test(String(event.time)) ? String(event.time) : "00:00";
      if (time.length === 4) time = "0" + time;
      return Date.parse(parts.iso + "T" + time + ":00");
    }

    function formatEventDisplayDateLong(iso) {
      var parts = eventDateParts(iso);
      if (!parts) return "";
      var monthIdx = parseInt(parts.iso.slice(5, 7), 10) - 1;
      return parts.day + " " + (MONTHS_FULL[monthIdx] || parts.month.toUpperCase()) + " " + parts.year;
    }

    function normalizeEvents(data) {
      var list = [];
      if (data && Array.isArray(data.events)) {
        list = data.events.slice();
      } else if (data && Array.isArray(data.shows)) {
        // Legacy shape → map into events
        list = data.shows
          .filter(function (s) {
            return s && !s.venueOnly && s.isoDate;
          })
          .map(function (s) {
            return {
              id: s.isoDate + "-" + (s.venue || s.title || ""),
              date: s.isoDate,
              time: s.time || "",
              venue: s.venue || "",
              city: (s.location || "").split(",")[0] || "",
              region: (s.location || "").split(",")[1] ? (s.location || "").split(",")[1].trim() : "",
              country: "Norway",
              title: s.kicker || s.title || "",
              body: s.body || "",
              ticketUrl: s.ticketUrl || "",
              status: "confirmed",
              image: s.image || ""
            };
          });
      }
      return list
        .filter(function (e) {
          return e && e.date;
        })
        .map(function (e) {
          var copy = Object.assign({}, e);
          if (!copy.detailUrl && copy.eventPage) copy.detailUrl = copy.eventPage;
          if (!copy.image && copy.poster) copy.image = copy.poster;
          return copy;
        });
    }

    function splitEvents(events) {
      var now = new Date();
      var upcoming = [];
      var past = [];
      events.forEach(function (e) {
        var status = (e.status || "confirmed").toLowerCase();
        var end = endOfEventDay(e.date);
        if (!end) return;
        var isPast = end.getTime() < now.getTime();
        if (status === "cancelled") {
          if (isPast) past.push(e);
          else upcoming.push(e);
          return;
        }
        if (isPast) past.push(e);
        else upcoming.push(e);
      });
      upcoming.sort(function (a, b) {
        return eventChronologyKey(a) - eventChronologyKey(b);
      });
      past.sort(function (a, b) {
        return eventChronologyKey(b) - eventChronologyKey(a);
      });
      return { upcoming: upcoming, past: past };
    }

    function eventLocationLine(item) {
      return [item.city, item.region || item.country].filter(Boolean).join(", ");
    }

    function eventTourRowHtml(item, opts) {
      if (!item) return "";
      opts = opts || {};
      var parts = eventDateParts(item.date) || { day: "", month: "", year: "" };
      var dateLine = (parts.day + " " + String(parts.month || "").toUpperCase()).trim();
      var yearLine = parts.year ? String(parts.year) : "";
      var city = (item.city || "").toUpperCase();
      var venue = (item.venue || item.title || "").toUpperCase();
      var time = item.time ? String(item.time) : "";
      var href = "#shows";
      var action = "";
      if (!opts.past && item.ticketUrl) {
        href = resolveHref(item.ticketUrl);
        action = "Tickets";
      } else if (!opts.past && item.detailUrl) {
        href = resolveHref(item.detailUrl);
        action = "Details";
      }
      var tag = href.indexOf("#") === 0 ? "div" : "a";
      var open =
        tag === "a"
          ? '<a class="tour-row" href="' + esc(href) + '" rel="noopener noreferrer">'
          : '<div class="tour-row">';
      var close = tag === "a" ? "</a>" : "</div>";
      return (
        open +
        '<div class="tour-row__date">' +
        (parts.day ? '<span class="tour-row__day">' + esc(parts.day) + "</span>" : "") +
        (parts.month ? '<span class="tour-row__month">' + esc(String(parts.month).toUpperCase()) + "</span>" : "") +
        (yearLine ? '<span class="tour-row__year">' + esc(yearLine) + "</span>" : "") +
        "</div>" +
        '<div class="tour-row__main">' +
        (city ? '<span class="tour-row__city">' + esc(city) + "</span>" : "") +
        '<p class="tour-row__venue">' +
        esc(venue) +
        "</p>" +
        "</div>" +
        (time ? '<span class="tour-row__time">' + esc(time) + "</span>" : "<span class=\"tour-row__time\"></span>") +
        (action ? '<span class="tour-row__action">' + esc(action) + "</span>" : "<span class=\"tour-row__action\"></span>") +
        close
      );
    }

    function eventCardHtml(item, opts) {
      if (!item) return "";
      opts = opts || {};
      var isPast = !!opts.past;
      var status = (item.status || "confirmed").toLowerCase();
      var cancelled = status === "cancelled";
      var parts = eventDateParts(item.date) || { day: "", month: "", year: "" };
      var timeMeta = [item.time, eventLocationLine(item)].filter(Boolean).join(" · ");
      var title = item.venue || item.title || "";
      var kicker = item.title && item.venue ? item.title : item.kicker || "";
      var classes = "show-card";
      if (!isPast && !cancelled) classes += " show-card--featured";
      if (item.specialGuest) classes += " show-card--special";
      if (cancelled) classes += " show-card--cancelled";
      if (isPast) classes += " show-card--past";

      var ticket = "";
      if (cancelled) {
        ticket = '<span class="show-card__badge show-card__badge--cancelled">CANCELLED</span>';
      } else if (!isPast && item.ticketUrl) {
        ticket =
          '<a class="btn btn-primary show-card__cta" href="' +
          esc(resolveHref(item.ticketUrl)) +
          '" rel="noopener noreferrer">Buy tickets</a>';
      } else if (!isPast && item.detailUrl) {
        ticket =
          '<a class="btn btn-ghost show-card__cta" href="' +
          esc(resolveHref(item.detailUrl)) +
          '">Event details</a>';
      }

      var guestNote = "";
      if (!isPast && item.specialGuest && item.specialNote) {
        guestNote = '<p class="show-card__guest">' + esc(item.specialNote) + "</p>";
      }

      return (
        '<article class="' +
        classes +
        '">' +
        '<div class="show-card__date" aria-hidden="true">' +
        '<span class="show-card__day">' +
        esc(parts.day) +
        "</span>" +
        '<span class="show-card__month">' +
        esc(parts.month) +
        "</span>" +
        '<span class="show-card__year">' +
        esc(parts.year) +
        "</span>" +
        "</div>" +
        '<div class="show-card__body">' +
        (kicker ? '<p class="show-card__kicker">' + esc(kicker) + "</p>" : "") +
        '<h3 class="show-card__title">' +
        esc(title) +
        "</h3>" +
        (timeMeta ? '<p class="show-card__meta">' + esc(timeMeta) + "</p>" : "") +
        (item.body ? '<p class="show-card__deck">' + esc(item.body) + "</p>" : "") +
        guestNote +
        "</div>" +
        ticket +
        "</article>"
      );
    }

    function injectUpcomingEventSchema(upcoming) {
      if (
        document.body &&
        document.body.classList.contains("page-live") &&
        document.getElementById("ld-events-static")
      ) {
        return;
      }
      var old = document.getElementById("ld-events-dynamic");
      if (old) old.remove();
      var bookable = (upcoming || []).filter(function (e) {
        return (e.status || "confirmed").toLowerCase() !== "cancelled" && e.date;
      });
      if (!bookable.length) return;
      var graph = bookable.map(function (e) {
        var locParts = [e.venue, e.city, e.region, e.country].filter(Boolean);
        var eventName =
          e.schemaName ||
          (e.title && e.venue ? e.title + " – " + e.venue : e.title || e.venue || "Håvard Pedersen");
        var performer;
        if (Array.isArray(e.lineup) && e.lineup.length) {
          performer = e.lineup.map(function (p) {
            return { "@type": "Person", name: p.name };
          });
        } else {
          performer = {
            "@type": "MusicGroup",
            name: "Håvard Pedersen Trio feat. Wild Willy Bendiksen & Knut Evenmo",
            url: "https://www.havardpedersen.com/live.html"
          };
        }
        var node = {
          "@type": "MusicEvent",
          name: eventName,
          startDate: e.time ? e.date + "T" + e.time + ":00" : e.date,
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          performer: performer,
          location: {
            "@type": "Place",
            name: e.venue || locParts[0] || "Venue",
            address: {
              "@type": "PostalAddress",
              addressLocality: e.city || "",
              addressRegion: e.region || "",
              addressCountry: e.country || "NO"
            }
          }
        };
        if (e.detailUrl) {
          node.url =
            e.detailUrl.indexOf("http") === 0
              ? e.detailUrl
              : "https://www.havardpedersen.com" + e.detailUrl;
        }
        if (e.body || e.specialNote) {
          node.description = e.body || e.specialNote;
        }
        if (e.ticketUrl) {
          node.offers = {
            "@type": "Offer",
            url: e.ticketUrl,
            availability: "https://schema.org/InStock"
          };
        }
        if (e.image) {
          node.image = e.image.indexOf("http") === 0 ? e.image : "https://www.havardpedersen.com" + e.image;
        }
        return node;
      });
      var script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = "ld-events-dynamic";
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph
      });
      document.head.appendChild(script);
    }

    function renderEvents(data) {
      var events = normalizeEvents(data);
      var split = splitEvents(events);
      var emptyEl = document.getElementById("shows-empty");
      var pastWrap = document.getElementById("shows-past-wrap");
      var pastRoot = document.getElementById("shows-past-grid");
      var liveDatesLink = document.querySelector(".hero__live-dates-link");

      if (showsRoot) {
        if (split.upcoming.length) {
          var upcomingHtml = split.upcoming.map(function (e) {
            return isHomepageLayout()
              ? eventTourRowHtml(e, { past: false })
              : eventCardHtml(e, { past: false });
          });
          showsRoot.innerHTML = upcomingHtml.join("");
          showsRoot.hidden = false;
          if (emptyEl) emptyEl.hidden = true;
          if (liveDatesLink) liveDatesLink.hidden = false;
        } else {
          showsRoot.innerHTML = "";
          showsRoot.hidden = true;
          if (emptyEl) emptyEl.hidden = false;
          if (liveDatesLink) liveDatesLink.hidden = true;
        }
      }

      if (pastRoot && pastWrap) {
        if (isHomepageLayout()) {
          pastRoot.innerHTML = "";
          pastWrap.hidden = true;
        } else if (split.past.length) {
          pastRoot.innerHTML = split.past
            .map(function (e) {
              return isHomepageLayout()
                ? eventTourRowHtml(e, { past: true })
                : eventCardHtml(e, { past: true });
            })
            .join("");
          pastWrap.hidden = false;
        } else {
          pastRoot.innerHTML = "";
          pastWrap.hidden = true;
        }
      }

      injectUpcomingEventSchema(split.upcoming);
      renderFeaturedEvent(split.upcoming);
      renderHeroNextShow(split.upcoming);
    }

    function getNextFeaturedEvent(upcoming) {
      if (!Array.isArray(upcoming) || !upcoming.length) return null;
      for (var i = 0; i < upcoming.length; i++) {
        var status = (upcoming[i].status || "confirmed").toLowerCase();
        if (status === "confirmed" || status === "soldout") return upcoming[i];
      }
      return null;
    }

    function billingHeadlineHtml(billing, fallbackTitle) {
      var text = billing || fallbackTitle || "";
      if (!text) return "";
      var lower = text.toLowerCase();
      var idx = lower.indexOf(" feat.");
      if (idx === -1) return esc(text);
      return esc(text.slice(0, idx)) + '<span class="featured-show__feat">' + esc(text.slice(idx)) + "</span>";
    }

    function formatFeaturedBody(text) {
      if (!text || typeof text !== "string") return "";
      return text
        .split(/\n\n+/)
        .map(function (paragraph) {
          var trimmed = paragraph.trim();
          if (!trimmed) return "";
          return '<p class="featured-show__body">' + esc(trimmed) + "</p>";
        })
        .filter(Boolean)
        .join("");
    }

    function renderFeaturedEvent(upcoming) {
      if (!featuredShowRoot) return;
      if (isHomepageLayout()) {
        if (featuredSection) featuredSection.hidden = true;
        return;
      }
      var event = getNextFeaturedEvent(upcoming);
      if (!event) {
        featuredShowRoot.innerHTML =
          '<p class="featured-show-fallback">Upcoming concerts are listed in the <a href="#shows">Live dates</a> section below.</p>';
        if (featuredSection) featuredSection.hidden = true;
        return;
      }

      var poster = event.poster || event.image || "";
      var posterAlt =
        event.posterAlt ||
        event.imageAlt ||
        (event.venue ? "Concert poster — " + event.venue : "Concert poster");
      var dateLine = formatEventDisplayDateLong(event.date);
      var venueLine = (event.venue || event.title || "").toUpperCase();
      var placeLine = (event.city || event.region || event.country || "").toUpperCase();
      var eyebrow = event.featuredEyebrow || "NEXT SHOW";
      var headline = billingHeadlineHtml(event.billing, event.title);
      var lineupHtml = "";
      if (Array.isArray(event.lineup) && event.lineup.length) {
        lineupHtml =
          '<ul class="featured-show__lineup" aria-label="Lineup">' +
          event.lineup
            .map(function (person) {
              return (
                "<li>" +
                esc(person.name) +
                " — " +
                esc(person.role) +
                (person.specialGuest ? " <span class=\"featured-show__guest-mark\">(special guest)</span>" : "") +
                "</li>"
              );
            })
            .join("") +
          "</ul>";
      }

      var guestHtml = "";
      if (event.specialGuest) {
        var guestPerson = null;
        if (Array.isArray(event.lineup)) {
          for (var g = 0; g < event.lineup.length; g++) {
            if (event.lineup[g] && event.lineup[g].specialGuest) {
              guestPerson = event.lineup[g];
              break;
            }
          }
        }
        var guestLabel = guestPerson
          ? (guestPerson.name + " — " + guestPerson.role).toUpperCase()
          : (event.specialGuestName || "Special guest").toUpperCase();
        guestHtml =
          '<div class="featured-show__guest" role="group" aria-label="Special guest">' +
          '<p class="featured-show__guest-label">SPECIAL GUEST</p>' +
          '<p class="featured-show__guest-name">' +
          esc(guestLabel) +
          "</p>" +
          "</div>";
      }

      var musicHtml = event.musicalFocus
        ? '<p class="featured-show__music">' + esc(String(event.musicalFocus).toUpperCase()) + "</p>"
        : "";
      var hookHtml = event.featuredHook
        ? '<p class="featured-show__hook">' + esc(event.featuredHook) + "</p>"
        : "";
      var bodyHtml = formatFeaturedBody(event.body);
      var taglineHtml = "";
      if (event.tagline) {
        taglineHtml =
          '<p class="featured-show__tagline">' +
          esc(event.tagline).replace(/\. /g, ".<br />") +
          "</p>";
      }

      var quoteHtml = "";
      if (event.quote && event.quote.text) {
        quoteHtml =
          "<blockquote class=\"featured-show__quote\"><p>“" +
          esc(event.quote.text) +
          "”</p>" +
          (event.quote.attribution
            ? "<footer>— " + esc(event.quote.attribution) + "</footer>"
            : "") +
          "</blockquote>";
      }

      var actionsHtml = "";
      if (event.ticketUrl) {
        actionsHtml =
          '<a class="btn btn-primary featured-show__cta" href="' +
          esc(resolveHref(event.ticketUrl)) +
          '" rel="noopener noreferrer">Buy tickets</a>';
      } else if (event.detailUrl) {
        actionsHtml =
          '<a class="btn btn-primary featured-show__cta" href="' +
          esc(resolveHref(event.detailUrl)) +
          '">Event details</a>';
      }

      var mediaHtml = "";
      if (poster) {
        var caption =
          (event.billing || event.title || event.venue || "Concert poster") +
          (dateLine ? " — " + dateLine : "");
        mediaHtml =
          '<div class="featured-show__media">' +
          '<a class="featured-show__poster-link" href="' +
          esc(resolveHref(poster)) +
          '" data-lightbox="true" data-caption="' +
          esc(caption) +
          '">' +
          '<img class="featured-show__poster" src="' +
          esc(resolveHref(poster)) +
          '" alt="' +
          esc(posterAlt) +
          '" width="681" height="1024" loading="lazy" decoding="async" />' +
          '<span class="featured-show__zoom-hint">Tap to enlarge</span>' +
          "</a></div>";
      }

      var articleEl = document.getElementById("featured-show");
      if (articleEl) {
        articleEl.className = "featured-show" + (poster ? "" : " featured-show--no-poster");
      }
      if (featuredSection) {
        featuredSection.hidden = false;
        featuredSection.setAttribute("aria-labelledby", "featured-show-title");
      }

      featuredShowRoot.innerHTML =
        mediaHtml +
        '<div class="featured-show__copy">' +
        '<p class="featured-show__eyebrow">' +
        esc(String(eyebrow).toUpperCase()) +
        "</p>" +
        '<h2 id="featured-show-title" class="featured-show__headline">' +
        headline +
        "</h2>" +
        '<p class="featured-show__when">' +
        (dateLine ? '<span class="featured-show__date">' + esc(dateLine) + "</span><br />" : "") +
        (venueLine ? '<span class="featured-show__event">' + esc(venueLine) + "</span><br />" : "") +
        (placeLine ? '<span class="featured-show__place">' + esc(placeLine) + "</span>" : "") +
        (event.time ? '<br /><span class="featured-show__time">' + esc(event.time) + "</span>" : "") +
        "</p>" +
        bodyHtml +
        taglineHtml +
        lineupHtml +
        guestHtml +
        musicHtml +
        hookHtml +
        quoteHtml +
        (actionsHtml ? '<div class="featured-show__actions">' + actionsHtml + "</div>" : "") +
        "</div>";

      featuredShowRoot.setAttribute("aria-busy", "false");
    }

    function renderShows(items) {
      // Back-compat for legacy shows[] only pages
      renderEvents({ shows: items });
    }

    /** @deprecated Legacy live[] rows for #live-gigs — prefer events[] for confirmed concerts. */
    function renderLive(items) {
      if (!liveRoot || !Array.isArray(items) || !items.length) return;
      liveRoot.innerHTML = items
        .map(function (item) {
          var links =
            Array.isArray(item.links) && item.links.length
              ? renderLinks(item.links, "gig-row-links")
              : "";
          var ticketClass = item.ticket ? " gig-row--tickets" : "";
          return (
            '<li class="gig-row' +
            ticketClass +
            '">' +
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

    function renderStore(items, storeSettings) {
      if (!storeRoot || !Array.isArray(items) || !items.length) return;
      var checkoutEnabled = !!(storeSettings && storeSettings.checkoutEnabled);
      var storeItems = items.filter(function (item) {
        return !(item && item.featured);
      });
      if (!storeItems.length) return;
      storeRoot.innerHTML = storeItems
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
          var featuredClass = item && item.featured ? " store-card--merch" : "";
          return (
            '<article class="news-card store-card' +
            featuredClass +
            '">' +
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
      var checkoutOn = !!(storeSettings && storeSettings.checkoutEnabled);
      var provider = esc(storeSettings.provider || "Payment provider");
      var statusText = esc(storeSettings.statusText || "");
      var helpText = storeSettings.helpText
        ? '<span class="store-checkout-help">' + esc(storeSettings.helpText) + "</span>"
        : "";
      var providerHtml = "";
      if (checkoutOn && storeSettings.provider) {
        providerHtml = ' <span class="store-checkout-provider">· Checkout: ' + provider + "</span>";
      }
      storeCheckoutStatus.innerHTML = statusText + providerHtml + (checkoutOn ? " " + helpText : "");
    }

    function renderVideos(items) {
      if (!videoRoot || !Array.isArray(items) || !items.length) return;

      function existingYoutubeIds() {
        var ids = Object.create(null);
        videoRoot.querySelectorAll("[data-youtube-id]").forEach(function (node) {
          var id = node.getAttribute("data-youtube-id");
          if (id) ids[id] = true;
        });
        videoRoot.querySelectorAll("iframe[src*='youtube']").forEach(function (frame) {
          var match = (frame.getAttribute("src") || "").match(/\/embed\/([^?&/]+)/);
          if (match) ids[match[1]] = true;
        });
        return ids;
      }

      function cardHtml(item) {
        if (item && item.archiveCard) {
          if (videoRoot.querySelector(".music-video-card--archive")) return "";
          return (
            '<div class="music-video-card music-video-card--archive">' +
            '<a class="music-video-archive-link" href="' +
            esc(item.href || "https://www.youtube.com/@havardhedde10") +
            '" rel="noopener noreferrer">' +
            '<span class="music-video-archive-kicker">' +
            esc(item.kicker || "YouTube") +
            "</span>" +
            '<strong class="music-video-archive-title">' +
            esc(item.title || "More videos") +
            "</strong>" +
            '<span class="music-video-archive-deck">' +
            esc(item.body || "") +
            "</span>" +
            "</a>" +
            "</div>"
          );
        }
        if (!item || !item.youtubeId || !YT_ID.test(item.youtubeId)) return "";
        return (
          '<div class="music-video-card">' +
          '<div class="yt-lazy" data-youtube-id="' +
          esc(item.youtubeId) +
          '" data-title="' +
          esc(item.title || "YouTube video") +
          '">' +
          '<button type="button" class="yt-lazy__btn" aria-label="Play ' +
          esc(item.title || "YouTube video") +
          '">' +
          '<img class="yt-lazy__thumb" src="https://i.ytimg.com/vi/' +
          esc(item.youtubeId) +
          '/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async" />' +
          '<span class="yt-lazy__play" aria-hidden="true"></span>' +
          "</button></div>" +
          '<p class="music-video-caption">' +
          esc(item.caption || "") +
          "</p>" +
          "</div>"
        );
      }

      if (videoRoot.getAttribute("data-preserve-static") === "true") {
        var known = existingYoutubeIds();
        var appendHtml = items
          .map(function (item) {
            if (item && item.youtubeId && known[item.youtubeId]) return "";
            return cardHtml(item);
          })
          .filter(Boolean)
          .join("");
        if (appendHtml) videoRoot.insertAdjacentHTML("beforeend", appendHtml);
        return;
      }

      videoRoot.innerHTML = items
        .map(cardHtml)
        .filter(Boolean)
        .join("");
    }

    function isNetlifyDeployHost() {
      var h = (location.hostname || "").toLowerCase();
      return h.indexOf("netlify.app") !== -1;
    }

    function setContactStatus(form, state, message) {
      var status = form.querySelector("#contact-form-status") || document.getElementById("contact-form-status");
      var btn = form.querySelector("#contact-submit") || form.querySelector('[type="submit"]');
      if (status) {
        status.hidden = !message;
        status.textContent = message || "";
        status.className = "contact-form-status" + (state ? " contact-form-status--" + state : "");
      }
      if (btn) {
        btn.disabled = state === "loading";
        if (state === "loading") btn.setAttribute("aria-busy", "true");
        else btn.removeAttribute("aria-busy");
      }
    }

    function encodeFormData(form) {
      var fd = new FormData(form);
      var params = new URLSearchParams();
      fd.forEach(function (value, key) {
        params.append(key, value == null ? "" : String(value));
      });
      return params.toString();
    }

    /**
     * Optional HTTPS action (e.g. Formspree), Netlify AJAX, or mailto fallback.
     */
    function applyContactForm(contactForm) {
      var form = document.querySelector("#contact-form") || document.querySelector("#contact .contact-form");
      if (!form) return;
      var alreadyBound = form.getAttribute("data-contact-bound") === "true";

      var cfg = contactForm && typeof contactForm === "object" ? contactForm : {};
      var action = cfg.action != null ? String(cfg.action).trim() : "";
      var provider = (cfg.provider && String(cfg.provider).trim().toLowerCase()) || "";
      var note = document.querySelector("#contact-form-provider-note");

      if (action.indexOf("https://") === 0) {
        form.setAttribute("action", action);
        form.removeAttribute("data-netlify");
        form.removeAttribute("data-netlify-honeypot");
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
        if (note && cfg.note) {
          note.hidden = false;
          note.textContent = String(cfg.note);
        }
      }

      // Show success banner when redirected back from Netlify / provider
      try {
        var params = new URLSearchParams(location.search || "");
        if (params.get("contact") === "sent") {
          setContactStatus(form, "success", "Message sent. Thank you — we’ll be in touch.");
        }
      } catch (err) {}

      if (alreadyBound) return;
      form.setAttribute("data-contact-bound", "true");

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (typeof form.reportValidity === "function" && !form.checkValidity()) {
          form.reportValidity();
          setContactStatus(form, "error", "Please fill in all required fields.");
          return;
        }

        var honeypot = form.querySelector('[name="bot-field"]');
        if (honeypot && honeypot.value) {
          setContactStatus(form, "success", "Message sent. Thank you.");
          return;
        }

        var externalAction = (form.getAttribute("action") || "").indexOf("https://") === 0;
        var host = (location.hostname || "").toLowerCase();
        var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
        var useNetlify =
          !externalAction &&
          !isLocal &&
          form.getAttribute("data-netlify") === "true" &&
          (provider === "netlify" || isNetlifyDeployHost());

        if (externalAction) {
          setContactStatus(form, "loading", "Sending…");
          fetch(form.getAttribute("action"), {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
            body: encodeFormData(form)
          })
            .then(function (res) {
              if (!res.ok) throw new Error("send failed");
              setContactStatus(form, "success", "Message sent. Thank you — we’ll be in touch.");
              form.reset();
            })
            .catch(function () {
              setContactStatus(form, "error", "Could not send. Please email havardpedersen@me.com.");
            });
          return;
        }

        function openMailtoHandoff() {
          var mailto = (cfg.mailto && String(cfg.mailto).trim()) || "havardpedersen@me.com";
          var subj =
            (cfg.subject && String(cfg.subject).trim()) || "Site contact — havardpedersen.com";
          var fd = new FormData(form);
          var body =
            "Name: " +
            (fd.get("name") || "") +
            "\r\nReply-to: " +
            (fd.get("email") || "") +
            "\r\n\r\n" +
            (fd.get("message") || "");
          setContactStatus(form, "success", "Opening your email app…");
          window.location.href =
            "mailto:" + mailto + "?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(body);
          if (note && cfg.mailtoNote) {
            note.hidden = false;
            note.textContent = String(cfg.mailtoNote);
          }
        }

        if (useNetlify) {
          setContactStatus(form, "loading", "Sending…");
          fetch("/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: encodeFormData(form)
          })
            .then(function (res) {
              if (!res.ok) throw new Error("netlify failed");
              setContactStatus(form, "success", "Message sent. Thank you — we’ll be in touch.");
              form.reset();
            })
            .catch(function () {
              openMailtoHandoff();
            });
          return;
        }

        // Mailto fallback (local / non-Netlify hosts)
        openMailtoHandoff();
      });
    }

    function bindContactFormMailtoFallback(contactForm) {
      // Handled inside applyContactForm (unified submit handler).
      void contactForm;
    }

    function renderPartners(items) {
      if (!partnersRoot || !Array.isArray(items) || !items.length) return;
      partnersRoot.innerHTML = items
        .map(function (item) {
          var name = (item && (item.brandLine || item.name)) || "";
          var href = item && item.website ? resolveHref(item.website) : "";
          var label = (item && item.linkLabel) || href || "Visit";
          if (!name) return "";
          if (href) {
            return (
              '<article class="partner-card partner-card--compact">' +
              '<h3 class="partner-card__name">' +
              esc(name) +
              "</h3>" +
              '<a href="' +
              esc(href) +
              '" rel="noopener noreferrer">' +
              esc(label) +
              "</a>" +
              "</article>"
            );
          }
          return (
            '<article class="partner-card partner-card--compact">' +
            '<h3 class="partner-card__name">' +
            esc(name) +
            "</h3>" +
            "</article>"
          );
        })
        .filter(Boolean)
        .join("");
    }

    function bindMerch(merch) {
      var root = document.getElementById("merch-feature");
      if (!root) return;

      var priceKr = Number(root.getAttribute("data-price-kr")) || 250;
      var shippingKr = Number(root.getAttribute("data-shipping-kr")) || 79;
      var email = "havardpedersen@me.com";
      if (merch && typeof merch === "object") {
        if (merch.priceKr != null) priceKr = Number(merch.priceKr) || priceKr;
        if (merch.shippingKr != null) shippingKr = Number(merch.shippingKr) || shippingKr;
        if (merch.email) email = String(merch.email);
        root.setAttribute("data-price-kr", String(priceKr));
        root.setAttribute("data-shipping-kr", String(shippingKr));
        var stockEl = document.getElementById("merch-stock");
        if (stockEl) {
          if (merch.stockLeft != null && merch.stockLeft !== "" && !Number.isNaN(Number(merch.stockLeft))) {
            stockEl.textContent = merch.stockLeft + " left in stock";
            stockEl.hidden = false;
          } else {
            stockEl.textContent = "";
            stockEl.hidden = true;
          }
        }
      }

      root.setAttribute("data-merch-email", email);

      var totalEl = document.getElementById("merch-total-amount");
      var itemEl = document.getElementById("merch-item-amount");
      var shippingEl = document.getElementById("merch-shipping-amount");
      var priceMainEl = root.querySelector(".merch-feature__price-main");
      var priceSubEl = root.querySelector(".merch-feature__price-sub");
      var orderBtn = document.getElementById("merch-order-email");
      var hintEl = document.getElementById("merch-size-hint");
      var total = priceKr + shippingKr;

      if (itemEl) itemEl.textContent = priceKr + " kr";
      if (shippingEl) shippingEl.textContent = shippingKr + " kr";
      if (totalEl) totalEl.textContent = total + " kr";
      if (priceMainEl) priceMainEl.textContent = priceKr + " kr";
      if (priceSubEl) priceSubEl.textContent = "+ " + shippingKr + " kr shipping (Norway)";

      function buildMailto(size) {
        var body =
          "Hi Håvard,\n\n" +
          "I would like to order the Rå Ekte Live T-Shirt.\n\n" +
          "Size: " +
          size +
          "\nQuantity: 1\n\n" +
          "Total (inc. shipping): " +
          total +
          " kr\n\n" +
          "Shipping address:\n\n" +
          "Thank you!";
        return (
          "mailto:" +
          email +
          "?subject=" +
          encodeURIComponent("Rå Ekte Live T-Shirt order") +
          "&body=" +
          encodeURIComponent(body)
        );
      }

      function getSelectedSize() {
        var selected = root.querySelector('input[name="merch-size"]:checked');
        return selected ? selected.value : "";
      }

      function onSizeChange() {
        var size = getSelectedSize();
        if (!size) {
          if (hintEl) {
            hintEl.textContent = "Choose a size above, then order";
            hintEl.classList.remove("is-ready");
          }
          if (orderBtn) orderBtn.classList.remove("is-ready");
          if (orderBtn) orderBtn.setAttribute("title", "Select a size first");
          return;
        }
        if (hintEl) {
          hintEl.textContent = "Size " + size + " selected — tap Order by email";
          hintEl.classList.add("is-ready");
        }
        if (orderBtn) {
          orderBtn.href = buildMailto(size);
          orderBtn.classList.add("is-ready");
          orderBtn.removeAttribute("title");
        }
      }

      function openMerchEmail(e) {
        var size = getSelectedSize();
        if (!size) {
          if (e) e.preventDefault();
          if (hintEl) {
            hintEl.textContent = "Pick a size first (L, XL, XXL or 3XL)";
            hintEl.classList.remove("is-ready");
          }
          var sizes = root.querySelector(".merch-sizes");
          if (sizes && sizes.scrollIntoView) {
            sizes.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
        var mailto = buildMailto(size);
        if (orderBtn) orderBtn.href = mailto;
        if (e) {
          e.preventDefault();
          window.location.href = mailto;
        }
      }

      if (root.getAttribute("data-merch-bound") !== "true") {
        root.setAttribute("data-merch-bound", "true");

        var mainImg = document.getElementById("merch-main-image");
        var captionEl = document.getElementById("merch-image-caption");
        var zoomBtn = root.querySelector(".merch-feature__zoom");
        root.querySelectorAll(".merch-thumb").forEach(function (btn) {
          btn.addEventListener("click", function () {
            root.querySelectorAll(".merch-thumb").forEach(function (b) {
              b.classList.remove("is-active");
              b.setAttribute("aria-selected", "false");
            });
            btn.classList.add("is-active");
            btn.setAttribute("aria-selected", "true");
            if (mainImg && btn.getAttribute("data-src")) {
              mainImg.src = btn.getAttribute("data-src");
              mainImg.alt = btn.getAttribute("data-alt") || mainImg.alt;
            }
            if (captionEl && btn.getAttribute("data-caption")) {
              captionEl.textContent = btn.getAttribute("data-caption");
            }
            if (zoomBtn && btn.getAttribute("data-caption")) {
              zoomBtn.setAttribute("data-caption", btn.getAttribute("data-caption"));
            }
          });
        });

        root.querySelectorAll('input[name="merch-size"]').forEach(function (input) {
          input.addEventListener("change", onSizeChange);
        });

        if (orderBtn) {
          orderBtn.addEventListener("click", openMerchEmail);
        }
      }

      onSizeChange();
    }

    if (merchFeature) {
      bindMerch(null);
    }

    fetch("/assets/content.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("Content fetch failed");
        return res.json();
      })
      .then(function (data) {
        if (!data || typeof data !== "object") return;
        renderLatestUpdates(buildLatestUpdates(data));
        var newsFromYear =
          data && typeof data.homepageNewsFromYear === "number"
            ? data.homepageNewsFromYear
            : 2025;
        renderTimeline(filterHomepageNews(data.timeline, newsFromYear), { limit: 3 });
        renderTimelineArchive(data.timelineArchive);
        if (data.pressArchive) {
          renderPressArchiveIntro(data.pressArchive.intro);
          renderPressArchive(data.pressArchive, data.recentInterviews);
        } else {
          renderRecentInterviews(data.recentInterviews);
        }
        renderEvents(data);
        renderLive(data.live);
        renderSocialLinks(data.social);
        renderFooterSocial(data.social);
        renderCredibilityGroups(data.credibilityGroups);
        renderPressHistory(data.pressHistory, data.pressArchive);
        renderHomepageTrio(data.homepageTrio);
        renderStore(data.store, data.storeSettings);
        renderStoreStatus(data.storeSettings);
        if (videoRoot && Array.isArray(data.videos)) {
          var secondary = data.videos.filter(function (v) {
            return v && v.youtubeId && !v.featured && v.kind !== "live-local" && !v.archiveCard;
          });
          if (isHomepageLayout()) secondary = secondary.slice(0, 2);
          if (secondary.length) renderVideos(secondary);
        }
        renderPartners(data.partners);

        applyHeroBackground(data.heroBackground);
        applyContactForm(data.contactForm);
        bindContactFormMailtoFallback(data.contactForm);
        bindMerch(data.merch);

      })
      .catch(function () {
        bindMerch(null);
        renderEvents({ events: [] });
        applyContactForm({ provider: "mailto", mailto: "havardpedersen@me.com" });
      });
  })();

  (function initLazyYouTube() {
    function loadEmbed(root) {
      if (!root || root.getAttribute("data-loaded") === "true") return;
      var id = root.getAttribute("data-youtube-id");
      if (!id || !YT_ID.test(id)) return;
      var title = root.getAttribute("data-title") || "YouTube video";
      root.setAttribute("data-loaded", "true");
      root.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' +
        id +
        '?rel=0&modestbranding=1&autoplay=1" title="' +
        title.replace(/"/g, "&quot;") +
        '" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>';
    }

    document.querySelectorAll(".yt-lazy").forEach(function (root) {
      var btn = root.querySelector(".yt-lazy__btn");
      if (!btn) return;
      btn.addEventListener("click", function () {
        loadEmbed(root);
      });
    });
  })();

  (function initLangToggle() {
    var KEY = "havard-lang";
    var html = document.documentElement;
    var strings = {
      en: {
        "nav.home": "Home",
        "nav.live": "Live",
        "nav.music": "Music",
        "nav.video": "Video",
        "nav.bio": "Bio",
        "nav.news": "News",
        "nav.epk": "EPK",
        "nav.contact": "Contact",
        "nav.tour": "Tour",
        "nav.about": "About",
        "nav.press": "Press",
        "nav.shop": "Shop",
        "nav.booking": "Booking",
        "lang.group": "Site navigation language",
        "footer.spotify": "Spotify",
        "footer.youtube": "YouTube",
        "footer.instagram": "Instagram",
        "footer.tiktok": "TikTok",
        "footer.facebook": "Facebook",
        "footer.booking": "Booking",
        "home.upcoming": "Upcoming Live",
        "home.latestMusic": "Latest Music",
        "home.watch": "Watch",
        "home.about": "About Håvard",
        "home.news": "Latest from Håvard",
        "home.press": "Press & Credentials",
        "home.pressHistory": "Selected press history",
        "home.follow": "Follow Håvard",
        "home.booking": "Booking",
        "home.merch": "Merch",
        "home.hero.listen": "Listen",
        "home.hero.watch": "Watch",
        "home.hero.live": "Live",
        "page.live.title": "LIVE",
        "page.live.kicker": "Tour",
        "page.live.lead": "Tour dates & upcoming shows",
        "page.live.upcoming": "Upcoming shows",
        "page.live.past": "Past shows",
        "page.music.title": "MUSIC",
        "page.music.kicker": "Streaming",
        "page.music.lead": "Albums, singles & streaming",
        "page.video.title": "VIDEO",
        "page.video.kicker": "Watch",
        "page.video.lead": "Live performances & official videos",
        "page.bio.title": "BIO",
        "page.bio.kicker": "Artist",
        "page.bio.lead": "The story of Håvard Pedersen",
        "page.news.title": "NEWS",
        "page.news.kicker": "Updates",
        "page.news.lead": "Latest updates & archive",
        "page.news.latest": "Latest",
        "page.news.archive": "Archive",
        "page.contact.title": "CONTACT",
        "page.contact.kicker": "Reach out",
        "page.contact.lead": "Booking & enquiries",
        "page.contact.booking": "Booking",
        "page.contact.social": "Follow",
        "hero.brand": "HÅVARD PEDERSEN",
        "hero.tagline": "NORWEGIAN GUITARIST · SINGER · SONGWRITER",
        "hero.positioning": "Guitar-driven blues rock from Arctic Norway.",
        "hero.ctaWatch": "WATCH LIVE",
        "hero.ctaListen": "LISTEN",
        "hero.ctaBook": "BOOK HÅVARD",
        "hero.liveDates": "LIVE DATES",
        "hero.micro": "Gretsch-endorsed · Rå Ekte Live · 100% live",
        "cred.label": "Featured with · Produced at · Endorsed by",
        "video.kicker": "Live performance",
        "video.title": "SEE HÅVARD LIVE",
        "video.deck": "No backing tracks. No tricks. Guitar, bass, drums and the moment.",
        "music.kicker": "Streaming",
        "music.title": "LATEST MUSIC",
        "music.lead": "Latest single — stream now.",
        "music.catalogue": "EXPLORE THE CATALOGUE",
        "shows.kicker": "Tour",
        "shows.title": "UPCOMING SHOWS",
        "shows.deck": "Confirmed dates only. Past concerts move automatically.",
        "shows.bookBand": "Book the band",
        "shows.upcoming": "Upcoming shows",
        "shows.past": "Past shows",
        "shows.empty":
          "New dates are being announced. Promoters and venues can contact us for 2026/2027 routing.",
        "shows.emptyCta": "BOOK THE BAND",
        "booking.kicker": "Booking",
        "booking.title": "BOOK HÅVARD PEDERSEN",
        "booking.sub": "Håvard Pedersen Trio feat. Wild Willy Bendiksen & Knut Evenmo",
        "booking.deck":
          "A guitar-forward live blues-rock act for clubs, festivals, concerts, and selected corporate or private events. 100% live — no backing tracks.",
        "booking.watch": "WATCH LIVE",
        "booking.gigplanet": "BOOK VIA GIGPLANET",
        "booking.direct": "DIRECT CONTACT",
        "about.kicker": "About",
        "about.readFull": "Read full biography",
        "press.kicker": "Media & promoters",
        "press.title": "PRESS / EPK",
        "press.deck": "Everything a journalist, venue or promoter needs — without waiting on email.",
        "shop.cta": "SHOP MERCH",
        "contact.kicker": "Reach out",
        "contact.title": "Contact",
        "contact.send": "Send message",
        "float.book": "Book"
      },
      no: {
        "nav.home": "Hjem",
        "nav.live": "Live",
        "nav.music": "Musikk",
        "nav.video": "Video",
        "nav.bio": "Bio",
        "nav.news": "Nyheter",
        "nav.epk": "EPK",
        "nav.contact": "Kontakt",
        "nav.tour": "Turné",
        "nav.about": "Om",
        "nav.press": "Presse",
        "nav.shop": "Butikk",
        "nav.booking": "Booking",
        "lang.group": "Språk for nettstedets navigasjon",
        "footer.spotify": "Spotify",
        "footer.youtube": "YouTube",
        "footer.instagram": "Instagram",
        "footer.tiktok": "TikTok",
        "footer.facebook": "Facebook",
        "footer.booking": "Booking",
        "home.upcoming": "Kommende konserter",
        "home.latestMusic": "Nyeste musikk",
        "home.watch": "Se",
        "home.about": "Om Håvard",
        "home.news": "Siste fra Håvard",
        "home.press": "Presse og referanser",
        "home.pressHistory": "Utvalgt pressehistorikk",
        "home.follow": "Følg Håvard",
        "home.booking": "Booking",
        "home.merch": "Merch",
        "home.hero.listen": "Lytt",
        "home.hero.watch": "Se",
        "home.hero.live": "Live",
        "page.live.title": "LIVE",
        "page.live.kicker": "Turné",
        "page.live.lead": "Turnédatoer og kommende konserter",
        "page.live.upcoming": "Kommende konserter",
        "page.live.past": "Tidligere konserter",
        "page.music.title": "MUSIKK",
        "page.music.kicker": "Streaming",
        "page.music.lead": "Album, singler og streaming",
        "page.video.title": "VIDEO",
        "page.video.kicker": "Se",
        "page.video.lead": "Liveopptredener og offisielle videoer",
        "page.bio.title": "BIO",
        "page.bio.kicker": "Artist",
        "page.bio.lead": "Historien om Håvard Pedersen",
        "page.news.title": "NYHETER",
        "page.news.kicker": "Oppdateringer",
        "page.news.lead": "Siste oppdateringer og arkiv",
        "page.news.latest": "Siste",
        "page.news.archive": "Arkiv",
        "page.contact.title": "KONTAKT",
        "page.contact.kicker": "Ta kontakt",
        "page.contact.lead": "Booking og henvendelser",
        "page.contact.booking": "Booking",
        "page.contact.social": "Følg",
        "hero.brand": "HÅVARD PEDERSEN",
        "hero.tagline": "NORSK GITARIST · SANGER · LÅTSKRIVER",
        "hero.positioning": "Gitar-drevet bluesrock fra Arktis.",
        "hero.ctaWatch": "SE LIVE",
        "hero.ctaListen": "LYTT",
        "hero.ctaBook": "BOOK HÅVARD",
        "hero.liveDates": "KONSERTER",
        "hero.micro": "Gretsch-endorsed · Rå Ekte Live · 100% live",
        "cred.label": "Med · Produsert hos · Endorsed av",
        "video.kicker": "Live",
        "video.title": "SE HÅVARD LIVE",
        "video.deck": "Ingen playback. Ingen triks. Gitar, bass, trommer og øyeblikket.",
        "music.kicker": "Streaming",
        "music.title": "NYESTE MUSIKK",
        "music.lead": "Nyeste singel — stream nå.",
        "music.catalogue": "UTFORSK KATALOGEN",
        "shows.kicker": "Turné",
        "shows.title": "KOMMENDE KONSERTER",
        "shows.deck": "Kun bekreftede datoer. Passerte konserter flyttes automatisk.",
        "shows.bookBand": "Book bandet",
        "shows.upcoming": "Kommende konserter",
        "shows.past": "Tidligere konserter",
        "shows.empty":
          "Nye datoer kunngjøres fortløpende. Arrangører kan kontakte oss for 2026/2027-routing.",
        "shows.emptyCta": "BOOK BANDET",
        "booking.kicker": "Booking",
        "booking.title": "BOOK HÅVARD PEDERSEN",
        "booking.sub": "Håvard Pedersen Trio feat. Wild Willy Bendiksen & Knut Evenmo",
        "booking.deck":
          "Et gitar-drevet live bluesrock-band for klubber, festivaler, konserter og utvalgte bedrifts- og private arrangementer. 100% live — ingen playback.",
        "booking.watch": "SE LIVE",
        "booking.gigplanet": "BOOK VIA GIGPLANET",
        "booking.direct": "DIREKTE KONTAKT",
        "about.kicker": "Om",
        "about.readFull": "Les full biografi",
        "press.kicker": "Media & arrangører",
        "press.title": "PRESSE / EPK",
        "press.deck": "Det journalister, scener og arrangører trenger — uten å vente på e-post.",
        "shop.cta": "KJØP MERCH",
        "contact.kicker": "Kontakt",
        "contact.title": "Kontakt",
        "contact.send": "Send melding",
        "float.book": "Book"
      }
    };

    function applyLang(lang) {
      if (!strings[lang]) lang = "en";
      html.setAttribute("data-lang", lang);
      html.setAttribute("lang", lang === "no" ? "nb" : "en");
      try {
        localStorage.setItem(KEY, lang);
      } catch (err) {}
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var key = el.getAttribute("data-i18n");
        if (key && strings[lang][key] != null) el.textContent = strings[lang][key];
      });
      document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
        var key = el.getAttribute("data-i18n-aria");
        if (key && strings[lang][key] != null) el.setAttribute("aria-label", strings[lang][key]);
      });
      document.querySelectorAll("[data-lang-set]").forEach(function (btn) {
        var active = btn.getAttribute("data-lang-set") === lang;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
      });
    }

    var stored = null;
    try {
      stored = localStorage.getItem(KEY);
    } catch (err) {}
    applyLang(stored === "no" ? "no" : "en");

    document.querySelectorAll("[data-lang-set]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        applyLang(btn.getAttribute("data-lang-set") || "en");
      });
    });
  })();
})();