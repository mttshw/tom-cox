(function () {
  "use strict";

  /* ---------- Mobile menu ---------- */

  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  /* ---------- Latest Substack posts ---------- */

  var SUBSTACK_URL = "https://tomcox.substack.com";

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    return typeof value === "string" && value.indexOf("https://") === 0 ? value : null;
  }

  function formatDate(iso) {
    var date = new Date(iso);
    if (isNaN(date)) return "";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  function renderPost(post, featured) {
    var url = safeUrl(post.url) || SUBSTACK_URL;
    var image = safeUrl(post.image);
    var media = image
      ? '<div class="post-media"><img src="' + escapeHtml(image) + '" alt="" loading="' + (featured ? "eager" : "lazy") + '" decoding="async"></div>'
      : '<div class="post-media post-media-empty" aria-hidden="true">TC</div>';
    var date = post.date
      ? '<time datetime="' + escapeHtml(post.date) + '">' + escapeHtml(formatDate(post.date)) + "</time>"
      : "";
    var label = featured ? '<span class="eyebrow">Latest</span>' : "";
    var excerpt = post.subtitle ? '<p class="post-excerpt">' + escapeHtml(post.subtitle) + "</p>" : "";

    return (
      '<article class="post' + (featured ? " post-featured" : "") + '">' +
        '<a class="post-link" href="' + escapeHtml(url) + '">' +
          media +
          '<div class="post-body">' +
            '<p class="post-meta">' + label + date + "</p>" +
            '<h3 class="post-title">' + escapeHtml(post.title) + "</h3>" +
            excerpt +
            '<span class="post-more link-arrow">Read on Substack</span>' +
          "</div>" +
        "</a>" +
      "</article>"
    );
  }

  function renderFallback(container) {
    container.innerHTML =
      '<div class="posts-fallback">' +
        "<p>Tom's latest stories and essays are all on Substack.</p>" +
        '<a class="button" href="' + SUBSTACK_URL + '">Read on Substack</a>' +
      "</div>";
    container.removeAttribute("aria-busy");
  }

  function initPosts() {
    var container = document.querySelector("[data-posts]");
    if (!container) return;

    var src = container.getAttribute("data-src");
    var fallback = container.getAttribute("data-fallback");
    var limit = parseInt(container.getAttribute("data-limit"), 10) || 7;

    function load(url) {
      return fetch(url, { cache: "no-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          return response.json();
        })
        .then(function (data) {
          var posts = (data && Array.isArray(data.posts) ? data.posts : []).filter(function (post) {
            return post && post.title && safeUrl(post.url);
          });
          if (!posts.length) throw new Error("No posts");
          return posts;
        });
    }

    // Live posts come from the Cloudflare Worker; the snapshot in data/posts.json
    // covers the Worker being down.
    load(src)
      .catch(function (error) {
        if (!fallback) throw error;
        return load(fallback);
      })
      .then(function (posts) {
        container.innerHTML = posts
          .slice(0, limit)
          .map(function (post, index) {
            return renderPost(post, index === 0);
          })
          .join("");
        container.removeAttribute("aria-busy");
      })
      .catch(function () {
        renderFallback(container);
      });
  }

  /* ---------- Contact form (Formspree) ---------- */

  function initContactForm() {
    var form = document.querySelector("[data-contact-form]");
    if (!form) return;

    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector('button[type="submit"]');

    function setStatus(state, message) {
      status.setAttribute("data-state", state);
      status.textContent = message;
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        setStatus("error", "This form hasn't been connected yet. See the README for setup.");
        return;
      }

      button.disabled = true;
      setStatus("pending", "Sending…");

      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (response) {
          if (!response.ok) throw new Error("HTTP " + response.status);
          form.reset();
          setStatus("success", "Thanks, your message has been sent.");
        })
        .catch(function () {
          setStatus("error", "Sorry, something went wrong. Please try again in a moment.");
        })
        .then(function () {
          button.disabled = false;
        });
    });
  }

  /* ---------- Footer year ---------- */

  function initYear() {
    var nodes = document.querySelectorAll("[data-year]");
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = new Date().getFullYear();
    }
  }

  initNav();
  initPosts();
  initContactForm();
  initYear();
})();
