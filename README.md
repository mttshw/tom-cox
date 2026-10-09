# tom-cox.com

Static site for author Tom Cox, hosted on GitHub Pages. It replaces the old Ghost site now that Tom publishes on Substack ([tomcox.substack.com](https://tomcox.substack.com)).

- **Home**: latest book releases, latest Substack posts, a Substack sign-up, all books and audiobooks, press quotes
- **About** (`/about/`)
- **Contact** (`/contact/`)
- **404**: catches old Ghost post links and points readers to the Substack archive

No build tools or dependencies. Plain HTML, CSS and a little JavaScript.

## Structure

```
site/                    Everything that gets published
  index.html             Homepage
  about/index.html
  contact/index.html
  404.html               Uses absolute paths (served at any missing URL)
  assets/css/style.css
  assets/js/main.js      Mobile menu, latest posts, contact form
  assets/images/
  data/posts.json        Fallback snapshot of the latest posts
scripts/fetch_posts.py   Refreshes data/posts.json from the Substack RSS feed (run locally)
.github/workflows/deploy.yml
```

## How the latest posts work

Substack's feed can't be read from the browser (no CORS headers), and Substack blocks requests from GitHub Actions. So the homepage reads posts from a small Cloudflare Worker, [`cloudlfare-worker-tom-cox`](https://cloudlfare-worker-tom-cox.matt-422.workers.dev), which lives in its own repo. The Worker fetches Substack's JSON API (falling back to the RSS feed) and returns the posts as JSON. Responses are cached for 5 minutes, so a new Substack post shows up on the site within about 5 minutes.

If the Worker is down, the homepage falls back to `site/data/posts.json`, a snapshot committed to this repo. To refresh it, run `python3 scripts/fetch_posts.py` locally and commit the result (it can't run in GitHub Actions because Substack blocks it). If both fail, the homepage shows a link to Substack.

The Worker URL is set in the `data-src` attribute of the posts section in `site/index.html`.

## Local preview

```sh
python3 scripts/fetch_posts.py        # optional: refresh the fallback posts.json
python3 -m http.server 8000 -d site
```

Then open http://localhost:8000.

## Deploying

1. Push this repo to GitHub.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. The workflow deploys on the next push (or run it manually).

### Custom domain (www.tom-cox.com)

1. In **Settings → Pages → Custom domain**, enter `www.tom-cox.com` and save.
2. At the DNS provider:
   - `www`: `CNAME` record pointing to `<github-username>.github.io`
   - apex `tom-cox.com`: `A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
3. Once the certificate is issued, tick **Enforce HTTPS**.

The page links use relative paths, so the site also works at `<user>.github.io/<repo>/` while testing. The exception is `404.html`, which needs the custom domain.

## Before going live

- **Contact form.** Create a free form at [formspree.io](https://formspree.io), using the email address messages should go to. Then replace `YOUR_FORM_ID` in `site/contact/index.html`. Until then, the form shows a "not connected yet" message instead of sending.
- **About page.** The bio is a short draft based on the old About page, which was out of date because it said Tom had left Substack. Swap in Tom's own words if he'd prefer.

## Updating books

- **New release:** edit the hero section at the top of `site/index.html` (title, cover, order links).
- **Book list:** add or edit a `<li class="book">` in the Books or Audiobooks grid in `site/index.html`.
- **Covers:** go in `site/assets/images/books/`. Use 500px wide with a 5:8 ratio, and save as JPEG.
