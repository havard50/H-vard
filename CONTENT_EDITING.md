# Content Editing (No HTML Changes)

The site now reads key homepage sections from:

- `assets/content.json`

You can update these areas by editing JSON only:

- timeline feed (`timeline`)
- live schedule (`live`)
- store cards (`store`)
- video cards (`videos`)

## Quick examples

## Add a timeline update
Add a new object at the top of `timeline`:

```json
{
  "kicker": "Live update",
  "title": "New festival confirmed",
  "body": "Band confirmed for August festival.",
  "links": [
    { "label": "Live", "href": "#live" },
    { "label": "Booking", "href": "https://www.gigplanet.no/band/havard-pedersen-and-the-blues-is-alright-band" }
  ]
}
```

## Add a live date
Add an item to `live`:

```json
{
  "date": "12 Sep 2026",
  "meta": "Hammerfest Bluesclub, Akkarfjord"
}
```

## Add a product/store card
Add an item to `store`:

```json
{
  "kicker": "Merch",
  "title": "Limited tee drop",
  "body": "First wave of tour shirts available now.",
  "links": [
    { "label": "Buy now", "href": "https://example.com" }
  ]
}
```

## Add a YouTube video
Add an item to `videos` with `youtubeId`:

```json
{
  "youtubeId": "zEXcH3lHjls",
  "title": "Det sku bli oss — Håvard Pedersen",
  "caption": "Official video"
}
```

## Notes

- Keep JSON valid (commas, quotes, brackets).
- Use newest items first.
- If JSON fails to load, the page still shows static fallback content.
