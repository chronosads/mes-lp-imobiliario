(function(){
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- ano do rodapé ---- */
  document.getElementById("ano").textContent = new Date().getFullYear();

  /* ---- cabeçalho fixo ---- */
  var header = document.querySelector("header");
  var onScroll = function(){
    if (window.scrollY > 40) header.setAttribute("data-stuck","");
    else header.removeAttribute("data-stuck");
  };
  onScroll();
  addEventListener("scroll", onScroll, {passive:true});

  /* ---- revelação de blocos ---- */
  var items = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(function(el){ el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll("[data-reveal]"));
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 70 + "ms";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, {rootMargin:"0px 0px -12% 0px", threshold:.12});
    items.forEach(function(el){ io.observe(el); });
  }

  /* ---- trilho lateral: seção ativa ---- */
  var rail = document.querySelectorAll(".rail a");
  var secs = Array.prototype.map.call(rail, function(a){
    return document.querySelector(a.getAttribute("href"));
  });
  if ("IntersectionObserver" in window) {
    var ioRail = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        var i = secs.indexOf(e.target);
        if (i < 0) return;
        if (e.isIntersecting) {
          rail.forEach(function(a){ a.removeAttribute("data-active"); });
          rail[i].setAttribute("data-active","");
        }
      });
    }, {rootMargin:"-45% 0px -50% 0px"});
    secs.forEach(function(s){ if (s) ioRail.observe(s); });
  }

  /* ---- formulário: endpoint quando houver, WhatsApp enquanto não houver ---- */
  var form = document.getElementById("form");
  var status = document.getElementById("status");
  form.addEventListener("submit", function(ev){
    ev.preventDefault();
    var required = ["nome","contato","assunto"];
    for (var i=0;i<required.length;i++){
      var f = form.elements[required[i]];
      if (!f.value.trim()) { f.focus(); status.textContent = "Preencha nome, contato e assunto."; return; }
    }
    var data = {
      nome: form.elements.nome.value.trim(),
      contato: form.elements.contato.value.trim(),
      assunto: form.elements.assunto.value,
      valor: form.elements.valor.value,
      mensagem: form.elements.mensagem.value.trim(),
      origem: form.getAttribute("data-origem") || "lp",
      url: location.href
    };
    var endpoint = form.getAttribute("data-endpoint");
    if (endpoint) {
      status.textContent = "Enviando...";
      fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)})
        .then(function(r){
          status.textContent = r.ok
            ? "Mensagem enviada. O retorno é feito pelo contato informado."
            : "Não foi possível enviar agora. Use o WhatsApp abaixo.";
          if (r.ok) form.reset();
        })
        .catch(function(){ status.textContent = "Não foi possível enviar agora. Use o WhatsApp abaixo."; });
      return;
    }
    /* Sem endpoint configurado: compõe a mensagem no WhatsApp, sem perder o lead. */
    var linhas = [
      form.getAttribute("data-intro") || "Olá, vim pela landing page do escritório.",
      "Nome: " + data.nome,
      "Contato: " + data.contato,
      "Assunto: " + data.assunto
    ];
    if (data.valor) linhas.push("Valor aproximado: " + data.valor);
    if (data.mensagem) linhas.push("Situação: " + data.mensagem);
    status.textContent = "Abrindo o WhatsApp com os dados preenchidos...";
    window.open("https://wa.me/" + form.getAttribute("data-wa") + "?text=" + encodeURIComponent(linhas.join("\n")), "_blank", "noopener");
  });

  /* ============================================================
     MEDIÇÃO — fase 2 (Search/Meta). Nada é carregado sem aceite.
     Preencha os IDs abaixo; vazio = nenhum script de terceiro roda.
     ============================================================ */
  var TAGS = (window.MES_TAGS || { metaPixel: "", googleTag: "" });

  var cc = document.getElementById("cc");
  var KEY = "mes-consent";
  function loadTags(){
    if (TAGS.metaPixel) {
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', TAGS.metaPixel); window.fbq('track','PageView');
    }
    if (TAGS.googleTag) {
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + TAGS.googleTag;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", TAGS.googleTag);
    }
  }
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch(e){}
  if (saved === "ok") loadTags();
  else if (saved !== "no" && (TAGS.metaPixel || TAGS.googleTag)) cc.setAttribute("data-open","");
  document.getElementById("cc-ok").addEventListener("click", function(){
    try { localStorage.setItem(KEY,"ok"); } catch(e){}
    cc.removeAttribute("data-open"); loadTags();
  });
  document.getElementById("cc-no").addEventListener("click", function(){
    try { localStorage.setItem(KEY,"no"); } catch(e){}
    cc.removeAttribute("data-open");
  });
})();
