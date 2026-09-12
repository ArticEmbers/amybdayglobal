/* ============================================================
   Amy's Birthday Site — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fieldMouseX = 0, fieldMouseY = 0, fieldScrollY = 0;

  function applyFieldTransform() {
    var field = document.getElementById("starfield");
    if (!field) return;
    var x = fieldMouseX;
    var y = fieldMouseY + fieldScrollY;
    field.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  /* ------------------------------------------------------------
     1. STARFIELD — ambient twinkling background
     ------------------------------------------------------------ */
  function buildStarfield() {
    var field = document.getElementById("starfield");
    if (!field) return;

    var count = window.innerWidth < 640 ? 70 : 140;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var star = document.createElement("span");
      star.className = "star-dot";
      var size = (Math.random() * 1.8 + 0.6).toFixed(2);
      var top = (Math.random() * 100).toFixed(2);
      var left = (Math.random() * 100).toFixed(2);
      var duration = (Math.random() * 3.5 + 2.5).toFixed(2);
      var delay = (Math.random() * 5).toFixed(2);
      var minOp = (Math.random() * 0.2 + 0.08).toFixed(2);
      var maxOp = (Math.random() * 0.5 + 0.5).toFixed(2);

      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.top = top + "%";
      star.style.left = left + "%";
      star.style.setProperty("--min-op", minOp);
      star.style.setProperty("--max-op", maxOp);
      star.style.animationDuration = duration + "s";
      star.style.animationDelay = delay + "s";

      frag.appendChild(star);
    }
    field.appendChild(frag);

    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", function (e) {
        fieldMouseX = (e.clientX / window.innerWidth - 0.5) * 12;
        fieldMouseY = (e.clientY / window.innerHeight - 0.5) * 12;
        applyFieldTransform();
      });
    }
  }

  /* ------------------------------------------------------------
     2. NAV — background on scroll
     ------------------------------------------------------------ */
  function initNavScroll() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------
     2b. SCROLL PARALLAX — moon drifts slower than the page,
         starfield drifts slightly, both smoothed with rAF.
     ------------------------------------------------------------ */
  function initScrollParallax() {
    if (reduceMotion) return;
    var moon = document.getElementById("moon-parallax");
    if (!moon) {
      // Still let the starfield drift slightly on scroll even with no moon on the page.
    }
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (moon) moon.style.transform = "translateY(" + (y * 0.18) + "px)";
      fieldScrollY = y * 0.06;
      applyFieldTransform();
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------
     3. WARP TRANSITION — page-to-page "through the stars" effect
     ------------------------------------------------------------ */
  function buildWarpStars(container, count) {
    container.innerHTML = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "warp-star";
      var angle = Math.random() * 360;
      var dist = 420 + Math.random() * 520;
      var delay = Math.random() * 0.15;
      s.style.setProperty("--angle", angle + "deg");
      s.style.setProperty("--dist", dist + "px");
      s.style.setProperty("--delay", delay + "s");
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }

  function initWarpTransitions() {
    var overlay = document.getElementById("warp-overlay");
    var field = document.getElementById("warp-field");
    if (!overlay || !field) return;

    // Entrance: page loads "materializing" out of the warp.
    if (reduceMotion) {
      overlay.classList.add("hidden");
    } else {
      buildWarpStars(field, 26);
      requestAnimationFrame(function () {
        field.classList.add("active");
      });
      setTimeout(function () {
        overlay.classList.add("hidden");
      }, 120);
    }

    // Any link marked data-transition warps out before navigating.
    var links = document.querySelectorAll("[data-transition]");
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        if (!href || link.target === "_blank") return;
        e.preventDefault();

        if (reduceMotion) {
          window.location.href = href;
          return;
        }

        overlay.classList.remove("hidden");
        field.classList.remove("active");
        buildWarpStars(field, 26);
        requestAnimationFrame(function () {
          field.classList.add("active");
        });

        setTimeout(function () {
          window.location.href = href;
        }, 620);
      });
    });
  }

  /* ------------------------------------------------------------
     4. MAKE A WISH — a small three-step interaction that makes
        sure she actually wishes before pressing anything.
     ------------------------------------------------------------ */
  function initWishButton() {
    var stage = document.getElementById("wish-stage");
    var btn = document.getElementById("wish-btn");
    var yesBtn = document.querySelector(".wish-confirm-btn.yes");
    var noBtn = document.querySelector(".wish-confirm-btn.no");
    var checkText = document.querySelector(".wish-check");
    var response = document.getElementById("wish-response");
    if (!stage || !btn || !response) return;

    var steps = stage.querySelectorAll(".wish-step");
    var defaultCheckText = checkText ? checkText.textContent : "";

    var wishes = [
      "Wish sent, the sky keeps it for you now.",
      "Noted, by the nearest star.",
      "That one's already on its way, you'll just have to be patient.",
      "Granted. Probably, but the universe is a little slow sometimes."
    ];

    function goToStep(n) {
      steps.forEach(function (el, i) {
        el.classList.toggle("active", i === n);
      });
    }

    goToStep(0);

    // Step 1 -> 2: before revealing anything, double check the wish happened.
    btn.addEventListener("click", function () {
      if (checkText) checkText.textContent = defaultCheckText;
      goToStep(1);
    });

    // Step 2, "Yes" -> reveal the response.
    if (yesBtn) {
      yesBtn.addEventListener("click", function () {
        var text = wishes[Math.floor(Math.random() * wishes.length)];
        response.textContent = text;
        goToStep(2);
      });
    }

    // Step 2, "not yet" -> gently send her back to actually make the wish first.
    if (noBtn && checkText) {
      noBtn.addEventListener("click", function () {
        checkText.textContent = "Take a second, close your eyes, then press it again.\n\n(Also, go goon, at least u clear ur mind for a fully focused wish after <3, Anyways.)";
        setTimeout(function () {
          goToStep(0);
        }, 1600);
      });
    }
  }

  /* ------------------------------------------------------------
     5. SCROLL REVEAL — generic (.reveal / .reveal-scale), plus
        staggered groups (wishes list, note cards).
     ------------------------------------------------------------ */
  function initScrollReveal() {
    var single = document.querySelectorAll(".reveal, .reveal-scale");
    var groups = [
      document.querySelectorAll(".wishes-list li"),
      document.querySelectorAll(".note-grid .note-card")
    ];

    if (reduceMotion || !("IntersectionObserver" in window)) {
      single.forEach(function (el) { el.classList.add("visible"); });
      groups.forEach(function (list) {
        list.forEach(function (el) { el.classList.add("visible"); });
      });
      return;
    }

    var soloObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            soloObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    single.forEach(function (el) { soloObserver.observe(el); });

    groups.forEach(function (items) {
      if (!items.length) return;
      var groupObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var i = Array.prototype.indexOf.call(items, entry.target);
              setTimeout(function () {
                entry.target.classList.add("visible");
              }, Math.max(i, 0) * 110);
              groupObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      items.forEach(function (el) { groupObserver.observe(el); });
    });
  }

  /* ------------------------------------------------------------
     7. COUNTDOWN GATE — locks the page until Nov 14, 2026
     ------------------------------------------------------------ */
  function initCountdownGate() {
    var gate = document.getElementById("countdown-gate");
    if (!gate) return;

    var target = new Date("2026-11-14T00:00:00");
    document.body.classList.add("cg-locked");

    var daysEl = document.getElementById("cgDays");
    var hoursEl = document.getElementById("cgHours");
    var minsEl = document.getElementById("cgMins");
    var secsEl = document.getElementById("cgSecs");

    function reveal() {
      gate.style.transition = "opacity .8s ease";
      gate.style.opacity = "0";
      setTimeout(function () {
        gate.remove();
        document.body.classList.remove("cg-locked");
      }, 850);
    }

    function tick() {
      var diff = target - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        reveal();
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (daysEl) daysEl.textContent = String(d).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(m).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(s).padStart(2, "0");
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

2. Add it to the init block at the bottom of the file:

javascript
  document.addEventListener("DOMContentLoaded", function () {
    buildStarfield();
    initNavScroll();
    initScrollParallax();
    initWarpTransitions();
    initWishButton();
    initScrollReveal();
    initLetterReveal();
    initCountdownGate();   // ← add this line
  });

That's the JS half done — it's now consistent with the rest of your file's structure (checks the element exists, bails early if not present, uses the same coding style).

You still need the two other pieces from before on any page you want gated:

the <div id="countdown-gate">...</div> HTML markup, right after <body> opens
the CSS block for #countdown-gate and its children, in that page's <style>

The JS alone won't show anything — it just drives the numbers and removes the overlay once the date passes. Want me to fold the CSS into your shared stylesheet too, if you're using one across all the pages, instead of pasting it into each file separately?

/* ============================================================
   Amy's Birthday Site — shared behaviour
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fieldMouseX = 0, fieldMouseY = 0, fieldScrollY = 0;

  function applyFieldTransform() {
    var field = document.getElementById("starfield");
    if (!field) return;
    var x = fieldMouseX;
    var y = fieldMouseY + fieldScrollY;
    field.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  /* ------------------------------------------------------------
     1. STARFIELD — ambient twinkling background
     ------------------------------------------------------------ */
  function buildStarfield() {
    var field = document.getElementById("starfield");
    if (!field) return;

    var count = window.innerWidth < 640 ? 70 : 140;
    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var star = document.createElement("span");
      star.className = "star-dot";
      var size = (Math.random() * 1.8 + 0.6).toFixed(2);
      var top = (Math.random() * 100).toFixed(2);
      var left = (Math.random() * 100).toFixed(2);
      var duration = (Math.random() * 3.5 + 2.5).toFixed(2);
      var delay = (Math.random() * 5).toFixed(2);
      var minOp = (Math.random() * 0.2 + 0.08).toFixed(2);
      var maxOp = (Math.random() * 0.5 + 0.5).toFixed(2);

      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.top = top + "%";
      star.style.left = left + "%";
      star.style.setProperty("--min-op", minOp);
      star.style.setProperty("--max-op", maxOp);
      star.style.animationDuration = duration + "s";
      star.style.animationDelay = delay + "s";

      frag.appendChild(star);
    }
    field.appendChild(frag);

    if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", function (e) {
        fieldMouseX = (e.clientX / window.innerWidth - 0.5) * 12;
        fieldMouseY = (e.clientY / window.innerHeight - 0.5) * 12;
        applyFieldTransform();
      });
    }
  }

  /* ------------------------------------------------------------
     2. NAV — background on scroll
     ------------------------------------------------------------ */
  function initNavScroll() {
    var nav = document.getElementById("nav");
    if (!nav) return;
    function onScroll() {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------
     2b. SCROLL PARALLAX — moon drifts slower than the page,
         starfield drifts slightly, both smoothed with rAF.
     ------------------------------------------------------------ */
  function initScrollParallax() {
    if (reduceMotion) return;
    var moon = document.getElementById("moon-parallax");
    if (!moon) {
      // Still let the starfield drift slightly on scroll even with no moon on the page.
    }
    var ticking = false;

    function update() {
      var y = window.scrollY;
      if (moon) moon.style.transform = "translateY(" + (y * 0.18) + "px)";
      fieldScrollY = y * 0.06;
      applyFieldTransform();
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------
     3. WARP TRANSITION — page-to-page "through the stars" effect
     ------------------------------------------------------------ */
  function buildWarpStars(container, count) {
    container.innerHTML = "";
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var s = document.createElement("span");
      s.className = "warp-star";
      var angle = Math.random() * 360;
      var dist = 420 + Math.random() * 520;
      var delay = Math.random() * 0.15;
      s.style.setProperty("--angle", angle + "deg");
      s.style.setProperty("--dist", dist + "px");
      s.style.setProperty("--delay", delay + "s");
      frag.appendChild(s);
    }
    container.appendChild(frag);
  }

  function initWarpTransitions() {
    var overlay = document.getElementById("warp-overlay");
    var field = document.getElementById("warp-field");
    if (!overlay || !field) return;

    // Entrance: page loads "materializing" out of the warp.
    if (reduceMotion) {
      overlay.classList.add("hidden");
    } else {
      buildWarpStars(field, 26);
      requestAnimationFrame(function () {
        field.classList.add("active");
      });
      setTimeout(function () {
        overlay.classList.add("hidden");
      }, 120);
    }

    // Any link marked data-transition warps out before navigating.
    var links = document.querySelectorAll("[data-transition]");
    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        if (!href || link.target === "_blank") return;
        e.preventDefault();

        if (reduceMotion) {
          window.location.href = href;
          return;
        }

        overlay.classList.remove("hidden");
        field.classList.remove("active");
        buildWarpStars(field, 26);
        requestAnimationFrame(function () {
          field.classList.add("active");
        });

        setTimeout(function () {
          window.location.href = href;
        }, 620);
      });
    });
  }

  /* ------------------------------------------------------------
     4. MAKE A WISH — a small three-step interaction that makes
        sure she actually wishes before pressing anything.
     ------------------------------------------------------------ */
  function initWishButton() {
    var stage = document.getElementById("wish-stage");
    var btn = document.getElementById("wish-btn");
    var yesBtn = document.querySelector(".wish-confirm-btn.yes");
    var noBtn = document.querySelector(".wish-confirm-btn.no");
    var checkText = document.querySelector(".wish-check");
    var response = document.getElementById("wish-response");
    if (!stage || !btn || !response) return;

    var steps = stage.querySelectorAll(".wish-step");
    var defaultCheckText = checkText ? checkText.textContent : "";

    var wishes = [
      "Wish sent, the sky keeps it for you now.",
      "Noted, by the nearest star.",
      "That one's already on its way, you'll just have to be patient.",
      "Granted. Probably, but the universe is a little slow sometimes."
    ];

    function goToStep(n) {
      steps.forEach(function (el, i) {
        el.classList.toggle("active", i === n);
      });
    }

    goToStep(0);

    // Step 1 -> 2: before revealing anything, double check the wish happened.
    btn.addEventListener("click", function () {
      if (checkText) checkText.textContent = defaultCheckText;
      goToStep(1);
    });

    // Step 2, "Yes" -> reveal the response.
    if (yesBtn) {
      yesBtn.addEventListener("click", function () {
        var text = wishes[Math.floor(Math.random() * wishes.length)];
        response.textContent = text;
        goToStep(2);
      });
    }

    // Step 2, "not yet" -> gently send her back to actually make the wish first.
    if (noBtn && checkText) {
      noBtn.addEventListener("click", function () {
        checkText.textContent = "Take a second, close your eyes, then press it again.\n\n(Also, go goon, at least u clear ur mind for a fully focused wish after <3, Anyways.)";
        setTimeout(function () {
          goToStep(0);
        }, 1600);
      });
    }
  }

  /* ------------------------------------------------------------
     5. SCROLL REVEAL — generic (.reveal / .reveal-scale), plus
        staggered groups (wishes list, note cards).
     ------------------------------------------------------------ */
  function initScrollReveal() {
    var single = document.querySelectorAll(".reveal, .reveal-scale");
    var groups = [
      document.querySelectorAll(".wishes-list li"),
      document.querySelectorAll(".note-grid .note-card")
    ];

    if (reduceMotion || !("IntersectionObserver" in window)) {
      single.forEach(function (el) { el.classList.add("visible"); });
      groups.forEach(function (list) {
        list.forEach(function (el) { el.classList.add("visible"); });
      });
      return;
    }

    var soloObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            soloObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    single.forEach(function (el) { soloObserver.observe(el); });

    groups.forEach(function (items) {
      if (!items.length) return;
      var groupObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var i = Array.prototype.indexOf.call(items, entry.target);
              setTimeout(function () {
                entry.target.classList.add("visible");
              }, Math.max(i, 0) * 110);
              groupObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );
      items.forEach(function (el) { groupObserver.observe(el); });
    });
  }

  /* ------------------------------------------------------------
     6. LETTER REVEAL — staggered fade-in for message.html
     ------------------------------------------------------------ */
  function initLetterReveal() {
    var paragraphs = document.querySelectorAll(".letter-body p");
    var signoff = document.querySelector(".letter-signoff");
    var signature = document.querySelector(".letter-signature");
    if (!paragraphs.length) return;

    var all = Array.prototype.slice.call(paragraphs);
    if (signoff) all.push(signoff);
    if (signature) all.push(signature);

    if (reduceMotion) {
      all.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    all.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 700 + i * 260);
    });
  }

  /* ------------------------------------------------------------
     INIT
     ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    buildStarfield();
    initNavScroll();
    initScrollParallax();
    initWarpTransitions();
    initWishButton();
    initScrollReveal();
    initLetterReveal();
  });
})();

  /* ------------------------------------------------------------
     7. COUNTDOWN GATE — locks the page until Nov 14, 2026
     ------------------------------------------------------------ */
  function initCountdownGate() {
    var gate = document.getElementById("countdown-gate");
    if (!gate) return;

    var target = new Date("2026-11-14T00:00:00");
    document.body.classList.add("cg-locked");

    var daysEl = document.getElementById("cgDays");
    var hoursEl = document.getElementById("cgHours");
    var minsEl = document.getElementById("cgMins");
    var secsEl = document.getElementById("cgSecs");

    function reveal() {
      gate.style.transition = "opacity .8s ease";
      gate.style.opacity = "0";
      setTimeout(function () {
        gate.remove();
        document.body.classList.remove("cg-locked");
      }, 850);
    }

    function tick() {
      var diff = target - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        reveal();
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (daysEl) daysEl.textContent = String(d).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(m).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(s).padStart(2, "0");
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

  document.addEventListener("DOMContentLoaded", function () {
    buildStarfield();
    initNavScroll();
    initScrollParallax();
    initWarpTransitions();
    initWishButton();
    initScrollReveal();
    initLetterReveal();
    initCountdownGate();   // ← add this line
  }); like that so?

Reviewing code placement around a script's function structure.

Close, but there are two issues — right now you've got the new function living outside the closing })(); of the IIFE, and a second, separate DOMContentLoaded listener. That'll technically still run, since initCountdownGate would just become a global function and browsers happily allow multiple DOMContentLoaded listeners — but it breaks the pattern of the rest of the file (everything else is private inside the IIFE) and leaves you with two init blocks instead of one, which gets confusing to maintain.

Here's the corrected placement — initCountdownGate goes inside the IIFE alongside the other numbered functions, and gets called from the same, single init block at the bottom:

javascript
   
  /* ------------------------------------------------------------
     6. LETTER REVEAL — staggered fade-in for message.html
     ------------------------------------------------------------ */
  function initLetterReveal() {
    var paragraphs = document.querySelectorAll(".letter-body p");
    var signoff = document.querySelector(".letter-signoff");
    var signature = document.querySelector(".letter-signature");
    if (!paragraphs.length) return;

    var all = Array.prototype.slice.call(paragraphs);
    if (signoff) all.push(signoff);
    if (signature) all.push(signature);

    if (reduceMotion) {
      all.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    all.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 700 + i * 260);
    });
  }

  /* ------------------------------------------------------------
     7. COUNTDOWN GATE — locks the page until Nov 14, 2026
     ------------------------------------------------------------ */
  function initCountdownGate() {
    var gate = document.getElementById("countdown-gate");
    if (!gate) return;

    var target = new Date("2026-11-14T00:00:00");
    document.body.classList.add("cg-locked");

    var daysEl = document.getElementById("cgDays");
    var hoursEl = document.getElementById("cgHours");
    var minsEl = document.getElementById("cgMins");
    var secsEl = document.getElementById("cgSecs");

    function reveal() {
      gate.style.transition = "opacity .8s ease";
      gate.style.opacity = "0";
      setTimeout(function () {
        gate.remove();
        document.body.classList.remove("cg-locked");
      }, 850);
    }

    function tick() {
      var diff = target - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        reveal();
        return;
      }
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      var s = Math.floor((diff % 60000) / 1000);
      if (daysEl) daysEl.textContent = String(d).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(h).padStart(2, "0");
      if (minsEl) minsEl.textContent = String(m).padStart(2, "0");
      if (secsEl) secsEl.textContent = String(s).padStart(2, "0");
    }

    tick();
    var timer = setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------
     INIT
     ------------------------------------------------------------ */
  document.addEventListener("DOMContentLoaded", function () {
    buildStarfield();
    initNavScroll();
    initScrollParallax();
    initWarpTransitions();
    initWishButton();
    initScrollReveal();
    initLetterReveal();
    initCountdownGate();
  });
})();
