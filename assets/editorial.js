const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('#navigation');
function closeMenu() { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); }
menuButton.addEventListener('click', () => { const open = menu.classList.toggle('open'); menuButton.setAttribute('aria-expanded',String(open)); });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
const spotifyButton = document.querySelector('.spotify-play');
if (spotifyButton) {
 spotifyButton.addEventListener('click', () => {
  const player = document.querySelector('#featured-player');
  if (!player.querySelector('iframe')) {
   const frame = document.createElement('iframe');
   frame.title = 'Spotify player — Det sku bli oss by Håvard Pedersen';
   frame.src = 'https://open.spotify.com/embed/track/3b5YUyKuugvteTF85a3TpP?theme=0';
   frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
   frame.loading = 'lazy';
   player.append(frame);
  }
  const expanded = spotifyButton.getAttribute('aria-expanded') !== 'true';
  player.hidden = !expanded;
  spotifyButton.setAttribute('aria-expanded', String(expanded));
  spotifyButton.textContent = expanded ? 'Close player' : '▶ Play on Spotify';
 });
}
