
/* ============================================================
   Amy's Birthday Site — shared behaviour
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  var fieldMouseX = 0;
  var fieldMouseY = 0;
  var fieldScrollY = 0;

  /* ------------------------------------------------------------
     1. STARFIELD — ambient twinkling background
     ------------------------------------------------------------ */

  function applyFieldTransform() {
    var field = document.getElementById("starfield");
    if (!field) return;

    var x = fieldMouseX;
    var y = fieldMouseY + fieldScrollY;

    field.style.transform =
      "translate(" + x + "px, " + y + "px)";
  }

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

    if (
      !reduceMotion &&
      window.matchMedia("(pointer: fine)").matches
    ) {
      window.addEventListener("mousemove", function (e) {
        fieldMouseX =
          (e.clientX / window.innerWidth - 0.5) * 12;

        fieldMouseY =
          (e.clientY / window.innerHeight - 0.5) * 12;

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

    window.addEventListener("scroll", onScroll, {
      passive: true
    });

    onScroll();
  }

  /* ------------------------------------------------------------
     3. SCROLL PARALLAX — moon and starfield
     ------------------------------------------------------------ */

  function initScrollParallax() {
    if (reduceMotion) return;

    var moon = document.getElementById("moon-parallax");
    var ticking = false;

    function update() {
      var y = window.scrollY;

      if (moon) {
        moon.style.transform =
          "translateY(" + y * 0.18 + "px)";
      }

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
     4. WARP TRANSITIONS — page-to-page effect
     ------------------------------------------------------------ */

  function buildWarpStars(container, count) {
    container.innerHTML = "";

    var frag = document.createDocumentFragment();

    for (var i = 0; i < count; i++) {
      var star = document.createElement("span");

      star.className = "warp-star";

      var angle = Math.random() * 360;
      var dist = 420 + Math.random() * 520;
      var delay = Math.random() * 0.15;

      star.style.setProperty("--angle", angle + "deg");
      star.style.setProperty("--dist", dist + "px");
      star.style.setProperty("--delay", delay + "s");

      frag.appendChild(star);
    }

    container.appendChild(frag);
  }

  function initWarpTransitions() {
    var overlay = document.getElementById("warp-overlay");
    var field = document.getElementById("warp-field");

    if (!overlay || !field) return;

    // Entrance animation.

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

    // Links marked with data-transition.

    var links = document.querySelectorAll("[data-transition]");

    links.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");

        if (
          !href ||
          link.target === "_blank" ||
          e.ctrlKey ||
          e.metaKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }

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
     5. MAKE A WISH — three-step interaction
     ------------------------------------------------------------ */

  function initWishButton() {
    var stage = document.getElementById("wish-stage");
    var btn = document.getElementById("wish-btn");

    if (!stage || !btn) return;

    var yesBtn = stage.querySelector(".wish-confirm-btn.yes");
    var noBtn = stage.querySelector(".wish-confirm-btn.no");
    var checkText = stage.querySelector(".wish-check");
    var response = document.getElementById("wish-response");

    var steps = stage.querySelectorAll(".wish-step");

    if (steps.length < 3 || !response) {
      console.warn("Wish interaction: required HTML elements are missing.");
      return;
    }

    var defaultCheckText = checkText
      ? checkText.textContent
      : "";

    var wishes = [
      "Wish sent, the sky keeps it for you now.",
      "Noted, by the nearest star.",
      "That one's already on its way, you'll just have to be patient.",
      "Granted. Probably, but the universe is a little slow sometimes."
    ];

    var returnTimeout = null;

    function goToStep(n) {
      steps.forEach(function (el, i) {
        el.classList.toggle("active", i === n);
      });
    }

    // Start at step 1.

    goToStep(0);

    // STEP 1 -> STEP 2.

    btn.addEventListener("click", function () {
      if (returnTimeout) {
        clearTimeout(returnTimeout);
        returnTimeout = null;
      }

      if (checkText) {
        checkText.textContent = defaultCheckText;
      }

      goToStep(1);
    });

    // STEP 2 -> STEP 3.

    if (yesBtn) {
      yesBtn.addEventListener("click", function () {
        if (returnTimeout) {
          clearTimeout(returnTimeout);
          returnTimeout = null;
        }

        var randomIndex = Math.floor(
          Math.random() * wishes.length
        );

        response.textContent = wishes[randomIndex];

        goToStep(2);
      });
    }

    // STEP 2 -> STEP 1.

    if (noBtn) {
      noBtn.addEventListener("click", function () {
        if (checkText) {
          checkText.textContent =
            "Take a second, close your eyes, then press it again.\n\n" +
            "(Also, go goon, at least u clear ur mind for a fully focused wish after <3, Anyways.)";
        }

        if (returnTimeout) {
          clearTimeout(returnTimeout);
        }

        returnTimeout = setTimeout(function () {
          goToStep(0);
          returnTimeout = null;
        }, 1600);
      });
    }
  }

  /* ------------------------------------------------------------
     6. SCROLL REVEAL — elements and staggered groups
     ------------------------------------------------------------ */

  function initScrollReveal() {
    var single = document.querySelectorAll(
      ".reveal, .reveal-scale"
    );

    var groups = [
      document.querySelectorAll(".wishes-list li"),
      document.querySelectorAll(".note-grid .note-card")
    ];

    if (
      reduceMotion ||
      !("IntersectionObserver" in window)
    ) {
      single.forEach(function (el) {
        el.classList.add("visible");
      });

      groups.forEach(function (list) {
        list.forEach(function (el) {
          el.classList.add("visible");
        });
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

    single.forEach(function (el) {
      soloObserver.observe(el);
    });

    groups.forEach(function (items) {
      if (!items.length) return;

      var groupObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              var i = Array.prototype.indexOf.call(
                items,
                entry.target
              );

              setTimeout(function () {
                entry.target.classList.add("visible");
              }, Math.max(i, 0) * 110);

              groupObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.25 }
      );

      items.forEach(function (el) {
        groupObserver.observe(el);
      });
    });
  }

  /* ------------------------------------------------------------
     7. LETTER REVEAL — message page
     ------------------------------------------------------------ */

  function initLetterReveal() {
    var paragraphs = document.querySelectorAll(
      ".letter-body p"
    );

    var signoff = document.querySelector(".letter-signoff");
    var signature = document.querySelector(".letter-signature");

    if (!paragraphs.length) return;

    var all = Array.prototype.slice.call(paragraphs);

    if (signoff) all.push(signoff);
    if (signature) all.push(signature);

    if (reduceMotion) {
      all.forEach(function (el) {
        el.classList.add("visible");
      });

      return;
    }

    all.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add("visible");
      }, 700 + i * 260);
    });
  }

  /* ------------------------------------------------------------
     8. COUNTDOWN GATE — unlocks November 14, 2026
     ------------------------------------------------------------ */

  function initCountdownGate() {
    var gate = document.getElementById("countdown-gate");

    // Pages without a countdown gate are unaffected.

    if (!gate) return;

    var target = new Date("2026-11-14T00:00:00");

    var daysEl = document.getElementById("cgDays");
    var hoursEl = document.getElementById("cgHours");
    var minsEl = document.getElementById("cgMins");
    var secsEl = document.getElementById("cgSecs");

    var timer = null;
    var revealed = false;

    document.body.classList.add("cg-locked");

    // Countdown particles.

    var particleField = document.getElementById("cgParticles");

    if (particleField && !reduceMotion) {
      var frag = document.createDocumentFragment();

      var count = window.innerWidth < 640 ? 18 : 32;

      for (var i = 0; i < count; i++) {
        var particle = document.createElement("span");

        particle.className = "cg-particle";

        var size = (Math.random() * 2.5 + 1).toFixed(2);

        particle.style.width = size + "px";
        particle.style.height = size + "px";

        particle.style.left =
          (Math.random() * 100).toFixed(2) + "%";

        particle.style.top =
          (Math.random() * 100).toFixed(2) + "%";

        particle.style.setProperty(
          "--cg-op",
          (Math.random() * 0.4 + 0.3).toFixed(2)
        );

        particle.style.animationDuration =
          (Math.random() * 6 + 6).toFixed(2) + "s";

        particle.style.animationDelay =
          (Math.random() * 6).toFixed(2) + "s";

        frag.appendChild(particle);
      }

      particleField.appendChild(frag);
    }

    function reveal() {
      if (revealed) return;

      revealed = true;

      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }

      gate.style.transition = "opacity .8s ease";
      gate.style.opacity = "0";

      setTimeout(function () {
        gate.remove();
        document.body.classList.remove("cg-locked");
      }, 850);
    }

    function updateUnit(element, value) {
      if (!element) return;

      element.textContent = String(value).padStart(2, "0");
    }

    function tick() {
      var diff = target.getTime() - Date.now();

      if (diff <= 0) {
        reveal();
        return;
      }

      var days = Math.floor(diff / 86400000);
      var hours = Math.floor(
        (diff % 86400000) / 3600000
      );

      var mins = Math.floor(
        (diff % 3600000) / 60000
      );

      var secs = Math.floor(
        (diff % 60000) / 1000
      );

      updateUnit(daysEl, days);
      updateUnit(hoursEl, hours);
      updateUnit(minsEl, mins);
      updateUnit(secsEl, secs);
    }

    tick();

    if (!revealed) {
      timer = setInterval(tick, 1000);
    }
  }

  /* ------------------------------------------------------------
     9. INITIALIZATION — one single event listener
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

    console.log("Amy's Birthday Site initialized successfully.");
  });

})();
