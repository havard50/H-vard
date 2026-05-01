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
      var currentIndex = 0;
      var isTransitioning = false;
      var rotateAttr = parseInt(heroFrame.getAttribute("data-rotate-ms") || "16000", 10);
      var rotateMs = Math.min(120000, Math.max(8000, isNaN(rotateAttr) ? 16000 : rotateAttr));

      window.setInterval(function () {
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
  }

  (function initInstagramEmbeds() {
    function processEmbeds() {
      if (
        window.instgrm &&
        window.instgrm.Embeds &&
        typeof window.instgrm.Embeds.process === "function"
      ) {
        try {
          window.instgrm.Embeds.process();
        } catch (e) {}
      }
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", processEmbeds);
    } else {
      processEmbeds();
    }
    window.setTimeout(processEmbeds, 400);
    window.setTimeout(processEmbeds, 2000);
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
})();
