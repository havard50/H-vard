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

  var heroFrame = document.querySelector(".hero-video-frame");
  if (heroFrame) {
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

    if (videoIds.length > 1) {
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

      startHeroRotation();
      if (typeof reduceMotionMq.addEventListener === "function") {
        reduceMotionMq.addEventListener("change", onReduceMotionChange);
      } else if (typeof reduceMotionMq.addListener === "function") {
        reduceMotionMq.addListener(onReduceMotionChange);
      }
    }
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
})();
