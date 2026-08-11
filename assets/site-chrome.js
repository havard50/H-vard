(function initSiteChrome() {
  var mount = document.getElementById("site-chrome");
  if (!mount) return;

  var page =
    document.body.classList.contains("body--home")
      ? "home"
      : (document.body.className.match(/page-([a-z]+)/) || [])[1] || "";

  var nav = [
    { id: "home", href: "/", label: "Home" },
    { id: "live", href: "/live.html", label: "Live" },
    { id: "music", href: "/music.html", label: "Music" },
    { id: "video", href: "/video.html", label: "Video" },
    { id: "bio", href: "/bio.html", label: "Bio" },
    { id: "news", href: "/news.html", label: "News" },
    { id: "epk", href: "/epk.html", label: "EPK" },
    { id: "contact", href: "/contact.html", label: "Contact" }
  ];

  var links = nav
    .map(function (item) {
      var active = item.id === page ? ' aria-current="page"' : "";
      var i18n = ' data-i18n="nav.' + item.id + '"';
      return (
        '<a class="site-nav__link' +
        (item.id === page ? " is-active" : "") +
        '" href="' +
        item.href +
        '"' +
        active +
        i18n +
        ">" +
        item.label +
        "</a>"
      );
    })
    .join("");

  mount.innerHTML =
    '<div class="site-header__backdrop" id="site-nav-backdrop" hidden aria-hidden="true"></div>' +
    '<header class="site-header site-header--global" id="site-header">' +
    '<div class="site-header__inner">' +
    '<a class="site-wordmark" href="/" aria-label="Håvard Pedersen — home">' +
    '<span class="site-wordmark__name">HÅVARD PEDERSEN</span>' +
    "</a>" +
    '<div class="site-header__actions">' +
    '<nav class="site-nav site-nav--desktop" aria-label="Primary">' +
    links +
    "</nav>" +
    '<div class="lang-toggle" role="group" aria-label="Language" data-i18n-aria="lang.group">' +
    '<button type="button" class="lang-toggle__btn is-active" data-lang-set="en" aria-pressed="true">EN</button>' +
    '<button type="button" class="lang-toggle__btn" data-lang-set="no" aria-pressed="false">NO</button>' +
    "</div>" +
    '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-mobile">' +
    '<span class="sr-only">Menu</span>' +
    '<span class="nav-toggle-bar" aria-hidden="true"></span>' +
    "</button>" +
    "</div>" +
    '<nav id="site-nav-mobile" class="site-nav site-nav--mobile" aria-label="Primary mobile">' +
    '<p class="site-nav__mobile-title" aria-hidden="true">Menu</p>' +
    links +
    "</nav>" +
    "</div>" +
    "</header>";

  var footerMount = document.getElementById("site-footer-chrome");
  if (!footerMount) return;

  footerMount.innerHTML =
    '<div class="footer-inner">' +
    '<p class="footer-copy">© Håvard Pedersen · Rå Ekte Live</p>' +
    '<p class="footer-meta site-footer__nav">' +
    nav
      .map(function (item) {
        return (
          '<a href="' +
          item.href +
          '"' +
          (item.id === page ? ' aria-current="page"' : "") +
          ' data-i18n="nav.' +
          item.id +
          '">' +
          item.label +
          "</a>"
        );
      })
      .join(" · ") +
    "</p>" +
    '<p id="footer-social-links" class="footer-meta footer-meta--secondary footer-social" aria-label="Streaming and social links">' +
    '<a href="https://open.spotify.com/artist/50PJ7UncEwx3fUxJ1LgZid" rel="noopener noreferrer" data-i18n="footer.spotify">Spotify</a> · ' +
    '<a href="https://www.youtube.com/@havardhedde10" rel="noopener noreferrer" data-i18n="footer.youtube">YouTube</a> · ' +
    '<a href="https://www.instagram.com/haavard_pedersen_raa_ekte_live/" rel="noopener noreferrer" data-i18n="footer.instagram">Instagram</a> · ' +
    '<a href="https://www.tiktok.com/@haavardhedde" rel="noopener noreferrer" data-i18n="footer.tiktok">TikTok</a> · ' +
    '<a href="https://www.facebook.com/share/1D5WXFTpxz/?mibextid=wwXIfr" rel="noopener noreferrer" data-i18n="footer.facebook">Facebook</a>' +
    "</p>" +
    '<p class="footer-meta footer-meta--secondary">' +
    '<span data-i18n="footer.booking">Booking</span>: ' +
    '<a href="https://www.gigplanet.no/band/havard-pedersen-and-the-blues-is-alright-band" rel="noopener noreferrer">Gigplanet</a> · ' +
    '<a href="mailto:havardpedersen@me.com">havardpedersen@me.com</a>' +
    "</p>" +
    "</div>";
})();
