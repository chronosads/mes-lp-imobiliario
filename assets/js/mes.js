/* ============================================================
   MES Advogados — script compartilhado pelas DUAS landing pages.
   Sem dependência externa. Tudo degrada: se um bloco não existir
   na página, os outros continuam funcionando; se o arquivo não
   carregar, a página continua legível e o WhatsApp continua
   clicável (todo CTA é um <a href> de verdade, não um handler).

   Movimento (13/11/2026): abertura, régua de progresso, título
   palavra a palavra, revelação em camadas e paralaxe. Nada disso
   é pré-requisito para ler — e tudo some em prefers-reduced-motion.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var slice = function (l) { return Array.prototype.slice.call(l); };

  /* ---- 1 · abertura: tira a cortina assim que há o que mostrar ---- */
  (function () {
    var tirar = function () { document.documentElement.setAttribute("data-booted", ""); };
    if (reduce) return tirar();
    /* dois quadros depois do DOM pronto: o primeiro texto já foi pintado */
    var pronto = function () { requestAnimationFrame(function () { requestAnimationFrame(tirar); }); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", pronto);
    else pronto();
    /* trava de segurança: a cortina nunca fica mais que 1,4 s */
    setTimeout(tirar, 1400);
  })();

  /* ---- 2 · ano do rodapé ---- */
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---- 3 · cabeçalho fixo: só escreve no DOM quando o estado muda ---- */
  var header = document.querySelector("header");
  if (header) {
    var stuck = null;
    var onScroll = function () {
      var agora = window.scrollY > 40;
      if (agora === stuck) return;
      stuck = agora;
      if (agora) header.setAttribute("data-stuck", "");
      else header.removeAttribute("data-stuck");
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- 4 · título palavra a palavra ----
     Envolve cada palavra num <span class="w"> preservando <em> e <br>.
     Enquanto não roda, não existe .w e o título aparece inteiro. */
  function partirEmPalavras(el) {
    (function anda(node) {
      slice(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement("span");
            s.className = "w";
            s.textContent = p;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") {
          anda(n);
        }
      });
    })(el);
    return slice(el.querySelectorAll(".w"));
  }

  var titulos = slice(document.querySelectorAll("[data-split]"));
  if (titulos.length && !reduce && "IntersectionObserver" in window) {
    var ioT = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var palavras = e.target.__w || [];
          palavras.forEach(function (w, i) {
            w.style.transitionDelay = Math.min(i, 22) * 26 + "ms";
            w.classList.add("on");
          });
          ioT.unobserve(e.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 }
    );
    titulos.forEach(function (t) {
      t.__w = partirEmPalavras(t);
      ioT.observe(t);
    });
  }

  /* ---- 4b · etiqueta do herói, letra a letra ----
     Datilografia sem tirar o texto do DOM: cada letra vira um <span> que
     já nasce no lugar e só acende. Leitor de tela lê a etiqueta inteira. */
  (function () {
    var alvo = document.querySelector("[data-type]");
    if (!alvo || reduce) return;
    var texto = alvo.textContent;
    var letras = [];
    alvo.textContent = "";
    texto.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.className = "c";
      s.textContent = ch;
      alvo.appendChild(s);
      letras.push(s);
    });
    alvo.setAttribute("data-typing", "");
    var i = 0;
    var passo = function () {
      if (i >= letras.length) return alvo.removeAttribute("data-typing");
      letras[i++].classList.add("on");
      setTimeout(passo, 34);
    };
    setTimeout(passo, 420);
  })();

  /* ---- 5 · revelação dos blocos, em camadas ---- */
  var items = slice(document.querySelectorAll("[data-reveal]"));
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var el = e.target;
          var sibs = slice(el.parentNode.querySelectorAll("[data-reveal]"));
          el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + "ms";
          el.classList.add("is-in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---- 6 · trilho lateral: marca a seção visível ---- */
  var rail = slice(document.querySelectorAll(".rail a"));
  if (rail.length && "IntersectionObserver" in window) {
    var secs = rail.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var ioRail = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          var i = secs.indexOf(e.target);
          if (i < 0 || !e.isIntersecting) return;
          rail.forEach(function (a) { a.removeAttribute("aria-current"); });
          rail[i].setAttribute("aria-current", "true");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    secs.forEach(function (s) { if (s) ioRail.observe(s); });
  }

  /* ---- 7 · quadro único: progresso, paralaxe e botão flutuante ----
     Um só rAF para os três. Só transform e opacity; nada aqui lê
     layout depois de escrever, então não há reflow forçado. */
  (function () {
    var prog = document.querySelector(".prog");
    var float = document.querySelector(".float");
    var hero = document.querySelector(".hero");
    var contato = document.getElementById("contato");
    var camadas = slice(document.querySelectorAll("[data-par]"));
    if (reduce) camadas = [];
    if (!prog && !float && !camadas.length) return;

    var pedido = false;
    var quadro = function () {
      pedido = false;
      var vh = innerHeight;

      if (prog) {
        var alcance = document.documentElement.scrollHeight - vh;
        prog.style.setProperty("--p", alcance > 0 ? Math.min(1, scrollY / alcance).toFixed(4) : 0);
      }

      camadas.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -120 || r.top > vh + 120) return;
        var amp = Number(el.getAttribute("data-par")) || 14;
        var centro = r.top + r.height / 2 - vh / 2;
        el.style.setProperty("--py", (-(centro / vh) * amp).toFixed(1) + "px");
      });

      if (float) {
        /* some enquanto o herói está na tela e quando o contato chega:
           ali já existe um botão grande, e dois ao mesmo tempo leem como erro */
        var passouHero = hero ? hero.getBoundingClientRect().bottom < vh * 0.4 : scrollY > vh * 0.6;
        var chegouContato = contato ? contato.getBoundingClientRect().top < vh * 0.85 : false;
        if (passouHero && !chegouContato) float.removeAttribute("data-off");
        else float.setAttribute("data-off", "");
      }
    };

    var agendar = function () {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(quadro);
    };
    addEventListener("scroll", agendar, { passive: true });
    addEventListener("resize", agendar);
    quadro();
  })();

  /* ============================================================
     MEDIÇÃO — fase 2 (Search/Meta). Nada é carregado sem aceite.
     Os IDs vêm de window.MES_TAGS, definido em cada index.html.
     Vazio = nenhum script de terceiro roda e o aviso nem aparece.
     ============================================================ */
  var TAGS = window.MES_TAGS || { metaPixel: "", googleTag: "" };
  var cc = document.getElementById("cc");
  var KEY = "mes-consent";

  function loadTags() {
    if (TAGS.metaPixel) {
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return; n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
        t = b.createElement(e); t.async = !0; t.src = v;
        s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", TAGS.metaPixel);
      window.fbq("track", "PageView");
    }
    if (TAGS.googleTag) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + TAGS.googleTag;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", TAGS.googleTag);
    }
  }

  if (cc) {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) { /* modo privado */ }
    if (saved === "ok") loadTags();
    else if (saved !== "no" && (TAGS.metaPixel || TAGS.googleTag)) cc.setAttribute("data-open", "");

    var ok = document.getElementById("cc-ok");
    var no = document.getElementById("cc-no");
    if (ok) ok.addEventListener("click", function () {
      try { localStorage.setItem(KEY, "ok"); } catch (e) { /* ignora */ }
      cc.removeAttribute("data-open");
      loadTags();
    });
    if (no) no.addEventListener("click", function () {
      try { localStorage.setItem(KEY, "no"); } catch (e) { /* ignora */ }
      cc.removeAttribute("data-open");
    });
  }
})();
