const menuButton = document.querySelector('.menu-button');
const menu = document.querySelector('#navigation');
function closeMenu() { menu.classList.remove('open'); menuButton.setAttribute('aria-expanded','false'); }
menuButton.addEventListener('click', () => { const open = menu.classList.toggle('open'); menuButton.setAttribute('aria-expanded',String(open)); });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if(event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Oslo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function concertRow(show, past = false) {
 const row=document.createElement('article'); row.className='concert-row';
 const date=document.createElement('div');date.className='concert-date';date.textContent=show.isoDate ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(show.isoDate+'T12:00:00Z')) : 'TO BE ANNOUNCED';
 const copy=document.createElement('div');const title=document.createElement('h3');title.textContent=show.venue || show.title;const location=document.createElement('p');location.textContent=show.location || '';copy.append(title,location);row.append(date,copy);
 if(!past && show.ticketUrl && /^https:\/\//.test(show.ticketUrl)){const link=document.createElement('a');link.className='text-link';link.href=show.ticketUrl;link.textContent='Tickets ↗';row.append(link);}
 return row;
}
fetch('/assets/content.json').then(r=>{if(!r.ok)throw new Error('Content unavailable');return r.json();}).then(content=>{
 const dated=(content.shows || []).filter(s=>/^\d{4}-\d{2}-\d{2}$/.test(s.isoDate || ''));
 const upcoming=dated.filter(s=>s.isoDate>=today).sort((a,b)=>a.isoDate.localeCompare(b.isoDate));
 const past=dated.filter(s=>s.isoDate<today).sort((a,b)=>b.isoDate.localeCompare(a.isoDate));
 const list=document.querySelector('#concert-list');
 if(upcoming.length) list.replaceChildren(...upcoming.map(s=>concertRow(s)));
 else {list.replaceChildren();const p=document.createElement('p');p.textContent='New concert dates will be announced here. For booking enquiries, get in touch below.';list.append(p);}
 document.querySelector('#past-concerts').replaceChildren(...past.map(s=>concertRow(s,true)));
 document.querySelector('.past-shows').hidden=!past.length;
}).catch(()=>{document.querySelector('#concert-list').textContent='For current concert dates, contact Håvard or check his social channels.';document.querySelector('.past-shows').hidden=true;});

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
