(function initSitePages() {
  var pageMatch = document.body.className.match(/page-([a-z]+)/);
  var page = pageMatch ? pageMatch[1] : "";
  if (!page || page === "epk" || page === "press" || page === "home") return;

  var YT_ID = /^[a-zA-Z0-9_-]{11}$/;
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(text) {
    return esc(text).replace(/\n/g, "<br />");
  }

  function eventDateParts(iso) {
    if (!iso || typeof iso !== "string") return null;
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!m) return null;
    var monthIdx = parseInt(m[2], 10) - 1;
    return {
      year: m[1],
      month: MONTHS[monthIdx] || m[2],
      day: String(parseInt(m[3], 10))
    };
  }

  function formatNewsDate(iso) {
    if (!iso) return "";
    var d = new Date(iso + "T12:00:00");
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  function partitionEvents(events) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var upcoming = [];
    var past = [];
    (events || []).forEach(function (item) {
      if (!item || !item.date) return;
      if (String(item.status || "confirmed").toLowerCase() === "cancelled") return;
      var d = new Date(item.date + "T12:00:00");
      if (Number.isNaN(d.getTime())) return;
      if (d >= today) upcoming.push(item);
      else past.push(item);
    });
    upcoming.sort(function (a, b) {
      return a.date.localeCompare(b.date);
    });
    past.sort(function (a, b) {
      return b.date.localeCompare(a.date);
    });
    return { upcoming: upcoming, past: past };
  }

  function liveRowHtml(item, opts) {
    opts = opts || {};
    var href = "";
    var action = "";
    if (!opts.past && item.ticketUrl) {
      href = item.ticketUrl;
      action = "Tickets";
    } else if (!opts.past && item.detailUrl) {
      href = item.detailUrl;
      action = "Details";
    } else if (opts.past && item.detailUrl) {
      href = item.detailUrl;
      action = "Archive";
    }
    var tag = href ? "a" : "div";
    var parts = eventDateParts(item.date);
    var dateHtml = parts
      ? '<div class="tour-page-row__date">' +
        '<span class="tour-page-row__day">' +
        esc(parts.day) +
        "</span>" +
        '<span class="tour-page-row__month">' +
        esc(parts.month) +
        "</span>" +
        '<span class="tour-page-row__year">' +
        esc(parts.year) +
        "</span></div>"
      : '<div class="tour-page-row__date">' + esc(item.date || "") + "</div>";
    var city = item.city || "";
    var venue = item.venue || "";
    var time = item.time || "";
    var open =
      tag === "a"
        ? '<a class="tour-page-row" href="' + esc(href) + '" rel="noopener noreferrer">'
        : '<div class="tour-page-row">';
    return (
      open +
      dateHtml +
      (city ? '<span class="tour-page-row__city">' + esc(city) + "</span>" : "<span></span>") +
      '<p class="tour-page-row__venue">' +
      esc(venue) +
      "</p>" +
      (time ? '<span class="tour-page-row__time">' + esc(time) + "</span>" : "<span></span>") +
      (action
        ? '<span class="tour-page-row__action">' + esc(action) + "</span>"
        : "<span></span>") +
      (tag === "a" ? "</a>" : "</div>")
    );
  }

  function bindLazyYouTube(root) {
    (root || document).querySelectorAll(".yt-lazy").forEach(function (node) {
      if (node.getAttribute("data-bound") === "true") return;
      node.setAttribute("data-bound", "true");
      var btn = node.querySelector(".yt-lazy__btn");
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (node.getAttribute("data-loaded") === "true") return;
        var id = node.getAttribute("data-youtube-id");
        if (!id || !YT_ID.test(id)) return;
        var title = node.getAttribute("data-title") || "YouTube video";
        node.setAttribute("data-loaded", "true");
        node.innerHTML =
          '<iframe src="https://www.youtube-nocookie.com/embed/' +
          id +
          '?rel=0&modestbranding=1&autoplay=1" title="' +
          esc(title) +
          '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>';
      });
    });
  }

  function streamingLinksHtml(item) {
    var links = [];
    if (item.spotify) {
      links.push('<a href="' + esc(item.spotify) + '" rel="noopener noreferrer">Spotify</a>');
    }
    if (item.appleMusic) {
      links.push('<a href="' + esc(item.appleMusic) + '" rel="noopener noreferrer">Apple Music</a>');
    }
    if (item.youtube) {
      links.push('<a href="' + esc(item.youtube) + '" rel="noopener noreferrer">YouTube</a>');
    }
    return links.length ? '<div class="music-release__links">' + links.join("") + "</div>" : "";
  }

  function renderLive(data) {
    var upcomingRoot = document.getElementById("live-upcoming");
    var pastRoot = document.getElementById("live-past");
    if (!upcomingRoot || !pastRoot) return;
    var split = partitionEvents(data.events);
    upcomingRoot.innerHTML = split.upcoming
      .map(function (e) {
        return liveRowHtml(e, { past: false });
      })
      .join("");
    pastRoot.innerHTML = split.past
      .map(function (e) {
        return liveRowHtml(e, { past: true });
      })
      .join("");
    upcomingRoot.setAttribute("aria-busy", "false");
    pastRoot.setAttribute("aria-busy", "false");
    var upEmpty = document.getElementById("live-upcoming-empty");
    var pastEmpty = document.getElementById("live-past-empty");
    if (upEmpty) upEmpty.hidden = split.upcoming.length > 0;
    if (pastEmpty) pastEmpty.hidden = split.past.length > 0;
    renderRoutingNotes(data);
  }

  function renderRoutingNotes(data) {
    var section = document.getElementById("live-routing-section");
    var root = document.getElementById("live-routing");
    if (!root) return;
    var notes = data.routingNotes || [];
    if (!notes.length) {
      if (section) section.hidden = true;
      root.hidden = true;
      return;
    }
    root.innerHTML = notes
      .map(function (note) {
        var links = note.venueCalendarUrl
          ? '<p class="news-links"><a href="' +
            esc(note.venueCalendarUrl) +
            '" rel="noopener noreferrer">Venue calendar</a></p>'
          : "";
        return (
          '<article class="routing-item">' +
          '<p class="routing-item__status">Unconfirmed · routing</p>' +
          "<h3>" +
          esc(note.title || "") +
          "</h3>" +
          (note.location ? "<p>" + esc(note.location) + "</p>" : "") +
          (note.body ? "<p>" + esc(note.body) + "</p>" : "") +
          links +
          "</article>"
        );
      })
      .join("");
    root.setAttribute("aria-busy", "false");
  }

  function renderMusic(data) {
    var root = document.getElementById("music-catalog");
    if (!root || !data.releases) return;
    var html = [];
    var latest = data.releases.latest;
    if (latest) {
      html.push(
        '<section class="music-latest">' +
          '<h2 class="music-section-title">Latest release</h2>' +
          '<article class="music-release music-release--latest">' +
          (latest.cover
            ? '<figure class="music-release__cover"><img src="' +
              esc(latest.cover) +
              '" alt="' +
              esc(latest.title) +
              ' cover" width="600" height="600" loading="eager" decoding="async" /></figure>'
            : "") +
          "<div>" +
          "<h3>" +
          esc(latest.title) +
          "</h3>" +
          '<p class="site-page__lead">' +
          esc(latest.type || "Single") +
          " · " +
          esc(latest.year || "") +
          "</p>" +
          streamingLinksHtml(latest) +
          "</div></article></section>"
      );
    }
    var albums = data.releases.albums || [];
    if (albums.length) {
      html.push('<section class="music-albums"><h2 class="music-section-title">Albums</h2>');
      albums.forEach(function (album) {
        var tracks =
          Array.isArray(album.tracks) && album.tracks.length
            ? '<ol class="music-tracklist">' +
              album.tracks
                .map(function (track) {
                  var note = track.note ? ' <span>(' + esc(track.note) + ")</span>" : "";
                  return "<li>" + esc(track.title) + note + "</li>";
                })
                .join("") +
              "</ol>"
            : "";
        html.push(
          '<article class="music-release music-release--album">' +
            (album.cover
              ? '<figure class="music-release__cover"><img src="' +
                esc(album.cover) +
                '" alt="' +
                esc(album.title) +
                ' cover" width="400" height="400" loading="lazy" decoding="async" /></figure>'
              : "") +
            "<div>" +
            "<h3>" +
            esc(album.title) +
            "</h3>" +
            '<p class="site-page__lead">' +
            esc(album.type || "Album") +
            " · " +
            esc(album.year || "") +
            "</p>" +
            (album.notes ? "<p>" + esc(album.notes) + "</p>" : "") +
            streamingLinksHtml(album) +
            tracks +
            "</div></article>"
        );
      });
      html.push("</section>");
    }
    if (Array.isArray(data.releases.singles) && data.releases.singles.length) {
      html.push(
        '<section class="music-singles">' +
          "<h2>Singles</h2>" +
          "<ul>" +
          data.releases.singles
            .map(function (single) {
              return (
                "<li><strong>" +
                esc(single.title) +
                "</strong>" +
                (single.year ? " · " + esc(single.year) : "") +
                "</li>"
              );
            })
            .join("") +
          "</ul></section>"
      );
    }
    root.innerHTML = html.join("");
    root.setAttribute("aria-busy", "false");
  }

  function videoLazyHtml(video) {
    return (
      '<div class="yt-lazy" data-youtube-id="' +
      esc(video.youtubeId) +
      '" data-title="' +
      esc(video.title || "YouTube video") +
      '">' +
      '<button type="button" class="yt-lazy__btn" aria-label="Play ' +
      esc(video.title || "video") +
      '">' +
      '<img class="yt-lazy__thumb" src="https://i.ytimg.com/vi/' +
      esc(video.youtubeId) +
      '/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360" />' +
      '<span class="yt-lazy__play" aria-hidden="true"></span>' +
      "</button></div>"
    );
  }

  function videoLocalHtml(video) {
    return (
      '<video poster="' +
      esc(video.poster || "") +
      '" preload="none" playsinline controls controlslist="nodownload">' +
      '<source src="' +
      esc(video.src) +
      '" type="video/mp4" />' +
      "</video>"
    );
  }

  function renderVideo(data) {
    var featuredRoot = document.getElementById("video-featured");
    var archiveRoot = document.getElementById("video-archive");
    if (!archiveRoot || !Array.isArray(data.videos)) return;
    var videos = data.videos.filter(function (v) {
      return v && !v.archiveCard;
    });
    var featured = videos.find(function (v) {
      return v.featured;
    });
    var rest = videos.filter(function (v) {
      return v !== featured;
    });
    var liveVideos = rest.filter(function (v) {
      return v.kind === "live-local";
    });
    var musicVideos = rest.filter(function (v) {
      return v.kind === "youtube" || (v.youtubeId && v.kind !== "live-local");
    });
    var channelCard = (data.videos || []).find(function (v) {
      return v && v.archiveCard;
    });

    if (featuredRoot && featured) {
      var featuredMedia =
        featured.kind === "live-local" && featured.src
          ? videoLocalHtml(featured)
          : featured.youtubeId
            ? videoLazyHtml(featured)
            : "";
      featuredRoot.innerHTML =
        featuredMedia +
        (featured.caption ? '<p class="site-page__lead">' + esc(featured.caption) + "</p>" : "");
      featuredRoot.setAttribute("aria-busy", "false");
      bindLazyYouTube(featuredRoot);
    } else if (featuredRoot) {
      featuredRoot.hidden = true;
    }

    var html = "";
    if (liveVideos.length) {
      html +=
        '<section class="video-category"><h2>Live</h2><div class="video-archive-grid">' +
        liveVideos
          .map(function (video) {
            return (
              '<article class="video-card"><h3>' +
              esc(video.title || "Live clip") +
              "</h3>" +
              videoLocalHtml(video) +
              (video.caption ? '<p class="site-page__lead">' + esc(video.caption) + "</p>" : "") +
              "</article>"
            );
          })
          .join("") +
        "</div></section>";
    }
    if (musicVideos.length) {
      html +=
        '<section class="video-category"><h2>Music videos</h2><div class="video-archive-grid">' +
        musicVideos
          .map(function (video) {
            return (
              '<article class="video-card"><h3>' +
              esc(video.title || "Video") +
              "</h3>" +
              (video.youtubeId ? videoLazyHtml(video) : "") +
              (video.caption ? '<p class="site-page__lead">' + esc(video.caption) + "</p>" : "") +
              "</article>"
            );
          })
          .join("") +
        "</div></section>";
    }

    if (channelCard) {
      html +=
        '<div class="video-channel-cta">' +
        (channelCard.body ? "<p>" + esc(channelCard.body) + "</p>" : "") +
        (channelCard.href
          ? '<a class="site-btn site-btn--ghost" href="' +
            esc(channelCard.href) +
            '" rel="noopener noreferrer">Watch on YouTube</a>'
          : "") +
        "</div>";
    }

    archiveRoot.innerHTML = html;
    archiveRoot.setAttribute("aria-busy", "false");
    bindLazyYouTube(archiveRoot);
  }

  function renderBio(data) {
    var root = document.getElementById("bio-sections");
    if (!root || !data.bioPage) return;
    var bio = data.bioPage;
    root.innerHTML =
      (bio.lead ? '<p class="site-page__lead bio-lead">' + esc(bio.lead) + "</p>" : "") +
      (bio.sections || [])
        .map(function (section) {
          var splitClass = section.image ? " bio-block--split" : "";
          var pullquote =
            section.id === "trio" && section.paragraphs && section.paragraphs.length > 2
              ? '<p class="bio-pullquote">' + esc(section.paragraphs[2]) + "</p>"
              : "";
          return (
            '<section class="bio-block' +
            splitClass +
            '" id="' +
            esc(section.id || "") +
            '">' +
            "<div>" +
            (section.title ? "<h2>" + esc(section.title) + "</h2>" : "") +
            (section.paragraphs || [])
              .map(function (p, idx) {
                if (section.id === "trio" && idx === 2) return "";
                return "<p>" + nl2br(p) + "</p>";
              })
              .join("") +
            pullquote +
            (section.links || [])
              .map(function (link) {
                return (
                  '<p><a href="' +
                  esc(link.href) +
                  '" rel="noopener noreferrer">' +
                  esc(link.label || "Link") +
                  "</a></p>"
                );
              })
              .join("") +
            "</div>" +
            (section.image
              ? '<figure><img src="' +
                esc(section.image) +
                '" alt="' +
                esc(section.imageAlt || section.title || "") +
                '" loading="lazy" decoding="async" width="800" height="1000" /></figure>'
              : "") +
            "</section>"
          );
        })
        .join("");
    root.setAttribute("aria-busy", "false");
  }

  function groupTimelineByYear(items) {
    var groups = {};
    (items || []).forEach(function (item) {
      if (!item) return;
      var year = item.published ? String(item.published).slice(0, 4) : "Archive";
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });
    return Object.keys(groups)
      .sort(function (a, b) {
        return b.localeCompare(a);
      })
      .map(function (year) {
        return { year: year, items: groups[year] };
      });
  }

  function resolveNewsHref(href) {
    if (!href) return href;
    if (!href.startsWith("#")) return href;
    var map = {
      "#shows": "/live.html",
      "#about": "/bio.html",
      "#listen": "/music.html",
      "#video": "/video.html"
    };
    return map[href] || href;
  }

  function newsItemHtml(item) {
    var links =
      Array.isArray(item.links) && item.links.length
        ? '<p class="news-links">' +
          item.links
            .map(function (link) {
              var href = resolveNewsHref(link.href || "");
              return (
                '<a href="' + esc(href) + '">' + esc(link.label || "Read more") + "</a>"
              );
            })
            .join(" · ") +
          "</p>"
        : "";
    var imageBlock = item.image
      ? '<figure class="news-editorial__figure"><img src="' +
        esc(item.image) +
        '" alt="' +
        esc(item.imageAlt || item.title || "") +
        '" loading="lazy" decoding="async" width="400" height="300" /></figure>'
      : "";
    var noImageClass = item.image ? "" : " news-editorial__item--no-image";
    return (
      '<article class="news-editorial__item' +
      noImageClass +
      '">' +
      '<time class="news-editorial__date" datetime="' +
      esc(item.published || "") +
      '">' +
      esc(formatNewsDate(item.published)) +
      "</time>" +
      '<div class="news-editorial__body">' +
      (item.kicker ? '<p class="news-editorial__kicker">' + esc(item.kicker) + "</p>" : "") +
      "<h3>" +
      esc(item.title || "") +
      "</h3>" +
      (item.body ? "<p>" + esc(item.body) + "</p>" : "") +
      links +
      "</div>" +
      imageBlock +
      "</article>"
    );
  }

  function renderNews(data) {
    var latestRoot = document.getElementById("news-latest");
    var archiveRoot = document.getElementById("news-archive");
    if (!latestRoot) return;
    var fromYear =
      typeof data.homepageNewsFromYear === "number" ? data.homepageNewsFromYear : 2025;
    var latest = (data.timeline || []).filter(function (item) {
      if (!item || !item.published) return false;
      return parseInt(String(item.published).slice(0, 4), 10) >= fromYear;
    });
    var groups = groupTimelineByYear(latest);
    latestRoot.innerHTML =
      '<div class="news-editorial">' +
      groups
        .map(function (group) {
          return group.items.map(newsItemHtml).join("");
        })
        .join("") +
      "</div>";
    latestRoot.setAttribute("aria-busy", "false");

    if (archiveRoot) {
      var archiveItems = (data.timelineArchive || []).concat(
        (data.timeline || []).filter(function (item) {
          if (!item || !item.published) return false;
          return parseInt(String(item.published).slice(0, 4), 10) < fromYear;
        })
      );
      if (archiveItems.length) {
        archiveRoot.innerHTML =
          '<div class="news-editorial">' + archiveItems.map(newsItemHtml).join("") + "</div>";
      } else {
        archiveRoot.innerHTML =
          '<p class="site-page__lead">Older artist updates and release milestones are preserved in the press archive.</p>' +
          '<p><a class="site-btn site-btn--ghost" href="/press.html">Press &amp; credentials</a></p>';
      }
      archiveRoot.setAttribute("aria-busy", "false");
    }
  }

  function renderContactSocial(data) {
    var root = document.getElementById("contact-social");
    if (!root || !data.social) return;
    var s = data.social;
    var links = [
      s.instagramPrimary,
      s.instagramPersonal,
      s.youtube,
      s.tiktok,
      s.facebook,
      s.spotify,
      s.appleMusic
    ]
      .filter(Boolean)
      .map(function (item) {
        return (
          '<a href="' +
          esc(item.href) +
          '" rel="noopener noreferrer">' +
          esc(item.label || item.handle || "Link") +
          "</a>"
        );
      });
    root.innerHTML = links.join("");
  }

  function renderShop(data) {
    var root = document.getElementById("shop-store-rows");
    if (!root || !Array.isArray(data.store)) return;
    root.innerHTML = data.store
      .map(function (row) {
        if (!row) return "";
        var href =
          row.primaryAction && row.primaryAction.href
            ? row.primaryAction.href
            : row.links && row.links[0]
              ? row.links[0].href
              : "";
        var action =
          row.primaryAction && row.primaryAction.label
            ? row.primaryAction.label
            : "View";
        var tag = href ? "a" : "div";
        var open =
          tag === "a"
            ? '<a class="shop-store-row" href="' + esc(href) + '">'
            : '<div class="shop-store-row">';
        return (
          open +
          (row.previewImage
            ? '<figure class="shop-store-row__thumb"><img src="' +
              esc(row.previewImage) +
              '" alt="' +
              esc(row.previewAlt || row.title || "") +
              '" loading="lazy" decoding="async" width="100" height="100" /></figure>'
            : "<span></span>") +
          "<div>" +
          (row.kicker ? '<p class="shop-store-row__kicker">' + esc(row.kicker) + "</p>" : "") +
          '<h3 class="shop-store-row__title">' +
          esc(row.title || "") +
          "</h3>" +
          (row.body ? '<p class="shop-store-row__body">' + esc(row.body) + "</p>" : "") +
          (row.priceFrom
            ? '<p class="shop-store-row__meta">' + esc(row.priceFrom) + "</p>"
            : "") +
          "</div>" +
          '<span class="shop-store-row__action">' +
          esc(action) +
          "</span>" +
          (tag === "a" ? "</a>" : "</div>")
        );
      })
      .filter(Boolean)
      .join("");
    root.setAttribute("aria-busy", "false");
  }

  fetch("/assets/content.json", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("Content fetch failed");
      return res.json();
    })
    .then(function (data) {
      if (!data) return;
      if (page === "live") renderLive(data);
      if (page === "music") renderMusic(data);
      if (page === "video") renderVideo(data);
      if (page === "bio") renderBio(data);
      if (page === "news") renderNews(data);
      if (page === "contact") renderContactSocial(data);
      if (page === "shop") renderShop(data);
    })
    .catch(function () {
      var busy = document.querySelector("[aria-busy='true']");
      if (busy) busy.setAttribute("aria-busy", "false");
    });
})();
