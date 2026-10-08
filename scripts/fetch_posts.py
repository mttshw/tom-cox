#!/usr/bin/env python3
"""Fetch Tom's latest Substack posts and write them to site/data/posts.json.

Substack's RSS feed doesn't send CORS headers, so the browser can't read it
directly. This runs in the deploy workflow (and can be run locally) to turn the
feed into a small JSON file the homepage reads.

Only the title, teaser, date, cover image and link are kept - the full post
always lives on Substack.

If the feed can't be fetched or parsed, the existing posts.json is left alone
so a Substack outage never breaks a deploy.
"""

import email.utils
import html
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

FEED_URL = "https://tomcox.substack.com/feed"
OUT_PATH = Path(__file__).resolve().parent.parent / "site" / "data" / "posts.json"
MAX_POSTS = 12
TEASER_LENGTH = 220
IMAGE_WIDTH = 720


def fetch_feed(url):
    req = urllib.request.Request(url, headers={"User-Agent": "tom-cox.com post fetcher"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def clean_text(value):
    text = html.unescape(re.sub(r"<[^>]+>", " ", value or ""))
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) > TEASER_LENGTH:
        text = text[:TEASER_LENGTH].rsplit(" ", 1)[0].rstrip(",.;:") + "…"
    return text


def resize_image(url):
    # Substack CDN URLs look like .../image/fetch/$s_!abcd!,f_auto,.../<source>.
    # Adding a width after the signature segment serves a much smaller file.
    if not url:
        return None
    return re.sub(r"(/image/fetch/\$s_![^,/]+!,)", rf"\1w_{IMAGE_WIDTH},c_limit,", url, count=1)


def parse_posts(xml_bytes):
    root = ET.fromstring(xml_bytes)
    posts = []
    for item in root.iter("item"):
        link = (item.findtext("link") or "").strip()
        title = (item.findtext("title") or "").strip()
        if not link.startswith("https://") or not title:
            continue

        pub_date = item.findtext("pubDate")
        date = None
        if pub_date:
            date = email.utils.parsedate_to_datetime(pub_date).astimezone(timezone.utc).isoformat()

        enclosure = item.find("enclosure")
        image = None
        if enclosure is not None and enclosure.get("type", "").startswith("image/"):
            image = resize_image(enclosure.get("url"))

        posts.append({
            "title": html.unescape(title),
            "subtitle": clean_text(item.findtext("description")),
            "url": link,
            "date": date,
            "image": image,
        })

    posts.sort(key=lambda p: p["date"] or "", reverse=True)
    return posts[:MAX_POSTS]


def main():
    try:
        posts = parse_posts(fetch_feed(FEED_URL))
    except Exception as exc:  # network error, bad XML, etc.
        print(f"warning: could not update posts ({exc}); keeping existing {OUT_PATH.name}", file=sys.stderr)
        return 0

    if not posts:
        print(f"warning: feed had no posts; keeping existing {OUT_PATH.name}", file=sys.stderr)
        return 0

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "updated": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "source": "https://tomcox.substack.com",
        "posts": posts,
    }
    OUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(posts)} posts to {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
