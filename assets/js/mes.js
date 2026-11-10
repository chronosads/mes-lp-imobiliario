/* ============================================================
   MES Advogados — script compartilhado pelas DUAS landing pages.
   Sem dependência externa. Tudo degrada: se um bloco não existir
   na página, os outros continuam funcionando.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- ano do rodapé ---- */
  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---- cabeçalho fixo: só escreve no DOM quando o estado muda ---- */
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

  /* ---- revelação de blocos ---- */
  var items = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll("[data-reveal]"));
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---- trilho lateral: marca a seção visível ---- */
  var rail = Array.prototype.slice.call(document.querySelectorAll(".rail a"));
  if (rail.length && "IntersectionObserver" in window) {
    var secs = rail.map(function (a) { return document.querySelector(a.getAttribute("href")); });
    var ioRail = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = secs.indexOf(e.target);
        if (i < 0 || !e.isIntersecting) return;
        rail.forEach(function (a) { a.removeAttribute("aria-current"); });
        rail[i].setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { if (s) ioRail.observe(s); });
  }

  /* ---- formulário: endpoint quando houver, WhatsApp enquanto não houver ---- */
  var form = document.getElementById("form");
  var status = document.getElementById("status");
  if (form && status) {
    var obrigatorios = ["nome", "contato", "assunto"];

    var limpaErro = function (campo) {
      campo.removeAttribute("aria-invalid");
    };
    obrigatorios.forEach(function (nome) {
      var campo = form.elements[nome];
      if (campo) campo.addEventListener("input", function () { limpaErro(campo); });
      if (campo) campo.addEventListener("change", function () { limpaErro(campo); });
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();

      var faltando = null;
      obrigatorios.forEach(function (nome) {
        var campo = form.elements[nome];
        if (!campo) return;
        if (!campo.value.trim()) {
          campo.setAttribute("aria-invalid", "true");
          if (!faltando) faltando = campo;
        } else {
          limpaErro(campo);
        }
      });
      if (faltando) {
        faltando.focus();
        status.textContent = "Preencha nome, contato e assunto.";
        return;
      }

      var data = {
        nome: form.elements.nome.value.trim(),
        contato: form.elements.contato.value.trim(),
        assunto: form.elements.assunto.value,
        valor: form.elements.valor ? form.elements.valor.value : "",
        mensagem: form.elements.mensagem ? form.elements.mensagem.value.trim() : "",
        origem: form.getAttribute("data-origem") || "lp",
        url: location.href
      };

      var endpoint = form.getAttribute("data-endpoint");
      if (endpoint) {
        status.textContent = "Enviando...";
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        })
          .then(function (r) {
            status.textContent = r.ok
              ? "Mensagem enviada. O retorno é feito pelo contato informado."
              : "Não foi possível enviar agora. Use o WhatsApp ao lado.";
            if (r.ok) form.reset();
          })
          .catch(function () {
            status.textContent = "Não foi possível enviar agora. Use o WhatsApp ao lado.";
          });
        return;
      }

      /* Sem endpoint configurado: compõe a mensagem no WhatsApp, sem perder o contato. */
      var linhas = [
        form.getAttribute("data-intro") || "Olá, vim pela landing page do escritório.",
        "Nome: " + data.nome,
        "Contato: " + data.contato,
        "Assunto: " + data.assunto
      ];
      if (data.valor) linhas.push("Valor aproximado: " + data.valor);
      if (data.mensagem) linhas.push("Situação: " + data.mensagem);

      var alvo = "https://wa.me/" + form.getAttribute("data-wa") +
        "?text=" + encodeURIComponent(linhas.join("\n"));
      var janela = window.open(alvo, "_blank", "noopener");
      if (janela) {
        status.textContent = "Abrindo o WhatsApp com os dados preenchidos...";
      } else {
        /* bloqueador de pop-up: navega na própria aba em vez de falhar calado */
        status.textContent = "Abrindo o WhatsApp...";
        location.href = alvo;
      }
    });
  }

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
