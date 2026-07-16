# Alona's Digital Oak 🌳

Personal website — an intro, book reviews, a blog, and short-form thoughts.
Live at **https://aleshuk.github.io** (published automatically by GitHub Pages).

## Structure

```
index.html        Home — photo + about me
books.html        Book reviews (cards)
blog.html         Blog posts (cards)
thoughts.html     Short-form thoughts (timeline)
contact.html      Contact links
post.html         Reader for a single blog post / book review
assets/
  css/style.css   All styling (light + dark theme)
  js/main.js      Nav, theme toggle, content rendering
  img/            favicon + your photos
content/
  posts.json      The list of all posts/reviews/thoughts  ← edit this to add content
  posts/*.md      The body of each blog post & book review (Markdown)
```

## Add your photo

Drop your image at `assets/img/alona.jpg`, then in `index.html` replace the
`<div class="placeholder">…</div>` block inside `.hero-photo` with:

```html
<img src="assets/img/alona.jpg" alt="Alona">
```

## Add a blog post or book review

1. Add a Markdown file in `content/posts/`, e.g. `content/posts/my-post.md`.
2. Add one entry to `content/posts.json`:

```json
{
  "slug": "my-post",
  "type": "blog",            // "blog" or "book"
  "title": "My Post Title",
  "date": "2026-08-01",       // YYYY-MM-DD — newest shows first
  "excerpt": "One-line teaser shown on the card.",
  "tags": ["data", "life"],
  "cover": "assets/img/my-cover.jpg",   // optional
  "author": "Author Name",    // book reviews only
  "rating": 4                  // book reviews only, 1–5 stars
}
```

The slug **must match** the Markdown filename (without `.md`).

## Add a thought

Thoughts have no separate file — write them straight into `posts.json`:

```json
{ "slug": "unique-id", "type": "thought", "date": "2026-08-01",
  "body": "Your short thought. **Markdown** works here.", "tags": ["idea"] }
```

## Preview locally

The site loads content with `fetch`, which needs a web server (opening the
files directly via `file://` won't work). From this folder run:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Publish

Just push to the `main` branch — GitHub Pages rebuilds automatically:

```bash
git add -A && git commit -m "Update site" && git push
```

Changes appear at https://aleshuk.github.io within a minute or two.
(One-time: in the repo's **Settings → Pages**, set Source = "Deploy from a branch",
branch = `main`, folder = `/ (root)`.)
