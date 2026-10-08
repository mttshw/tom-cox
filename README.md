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
  data/posts.json        Latest posts, generated from the Substack feed
scripts/fetch_posts.py   Builds data/posts.json from the Substack RSS feed
.github/workflows/deploy.yml
```

## How the latest posts work

Substack's RSS feed can't be read directly from the browser (no CORS headers). So the deploy workflow runs `scripts/fetch_posts.py`, which turns the feed into `site/data/posts.json`, and the homepage renders from that file.

The workflow runs on every push to `main`, **every hour**, and on demand (Actions → Build and deploy → Run workflow). A new Substack post shows up on the site within about an hour.

The hourly run checks the posts against the live site's `posts.json` and only deploys if they've changed. Quiet hours upload no artifact. Pushes and manual runs always deploy. Each Pages artifact expires after 1 day.

If Substack is unreachable, the script keeps the existing `posts.json`, so a deploy never fails because of it. The committed `posts.json` is a snapshot for local preview.

> GitHub pauses scheduled workflows in repos with no commits for 60 days. If posts stop updating, re-enable the workflow from the Actions tab.

## Local preview

```sh
python3 scripts/fetch_posts.py        # optional: refresh posts.json
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
