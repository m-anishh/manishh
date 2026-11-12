/* Contact page */
(function () {
  var SITE = window.SITE, ICONS = window.ICONS;
  var p = SITE.profile;
  var MAX = 600;

  window.__PAGE__ = {
    id: "contact",
    build: function () {
      var socials = SITE.socials.map(function (s) {
        return '<li><a href="' + s.href + '" target="_blank" rel="noopener" title="' + s.label + '" aria-label="' + s.label + '">' + ICONS.get(s.icon, 16) + '</a></li>';
      }).join("");
      return '<div class="pb-2 reveal"><h1 class="title title--h1 title__separate">Contact<span class="title--tone">.</span></h1></div>' +
        '<section class="contact-hero reveal"><p class="contact-hero__lead">Have a project, a role, or a reliability problem worth talking about? Send a note — this demo form validates in the browser and shows a success state, but does not send anything.</p></section>' +
        '<div class="contact-layout reveal reveal-delay-1">' +
          '<aside class="contact-channels"><dl class="contact-channels__list">' +
            '<div class="contact-channels__item"><dt>Email</dt><dd><a class="contact-channels__mail" href="mailto:' + p.email + '">' + p.email + '</a></dd></div>' +
            (p.phone ? '<div class="contact-channels__item"><dt>Phone</dt><dd><a class="contact-channels__mail" href="tel:' + p.phone.replace(/\s+/g, "") + '">' + p.phone + '</a></dd></div>' : "") +
            '<div class="contact-channels__item"><dt>Location</dt><dd>' + p.location + '</dd></div>' +
            '<div class="contact-channels__item"><dt>Availability</dt><dd>' + p.availability.status + '</dd></div>' +
            '<div class="contact-channels__item"><dt>Elsewhere</dt><dd><ul class="contact-channels__social">' + socials + '</ul></dd></div>' +
          '</dl></aside>' +
          '<div class="contact-form-wrap">' +
            '<div data-notice></div>' +
            '<form data-contact-form novalidate>' +
              '<div class="contact-form-row">' +
                field("name", "Name", '<input class="contact-field__input" id="cf-name" name="name" type="text" placeholder="Your name" autocomplete="name">') +
                field("email", "Email", '<input class="contact-field__input" id="cf-email" name="email" type="email" placeholder="you@example.com" autocomplete="email">') +
              '</div>' +
              field("subject", "Subject", '<input class="contact-field__input" id="cf-subject" name="subject" type="text" placeholder="What is this about?">') +
              field("message", "Message", '<textarea class="contact-field__input contact-field__input--textarea" id="cf-message" name="message" placeholder="A few sentences about what you need…"></textarea>', true) +
              '<button class="contact-submit" type="submit" data-submit>' + ICONS.get("mail", 16) + '<span>Send message</span></button>' +
            '</form>' +
          '</div>' +
        '</div>';
    },
    mount: function (root) {
      var form = root.querySelector("[data-contact-form]");
      var notice = root.querySelector("[data-notice]");
      var msg = form.querySelector("#cf-message");
      var count = form.querySelector('[data-count="message"]');

      msg.addEventListener("input", function () {
        if (msg.value.length > MAX) msg.value = msg.value.slice(0, MAX);
        count.textContent = msg.value.length + " / " + MAX;
        count.classList.toggle("contact-field__count--limit", msg.value.length >= MAX);
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearErrors(form);
        var errs = validate(form);
        if (Object.keys(errs).length) { showErrors(form, errs); return; }
        var btn = form.querySelector("[data-submit]");
        btn.disabled = true;
        btn.innerHTML = '<span class="contact-submit__spinner"></span><span>Sending…</span>';
        setTimeout(function () {
          notice.innerHTML = '<div class="contact-notice contact-notice--success"><span class="contact-notice__icon">' + ICONS.get("check", 18) + '</span>' +
            '<div class="contact-notice__body"><span class="contact-notice__heading">Message ready</span>' +
            '<span class="contact-notice__text">This is a demo — nothing was actually sent. In production this would hit your form endpoint.</span></div></div>';
          form.reset(); count.textContent = "0 / " + MAX;
          btn.disabled = false; btn.innerHTML = ICONS.get("mail", 16) + '<span>Send message</span>';
          notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }, 850);
      });
    }
  };

  function field(name, label, control, isMessage) {
    var head = '<div class="contact-field__head"><label class="contact-field__label" for="cf-' + name + '">' + label + '</label>' +
      (isMessage ? '<span class="contact-field__count" data-count="message">0 / ' + MAX + '</span>' : "") + '</div>';
    return '<div class="contact-field" data-field="' + name + '">' + head + control + '</div>';
  }
  function validate(form) {
    var errs = {};
    var name = form.name.value.trim(), email = form.email.value.trim(), subject = form.subject.value.trim(), message = form.message.value.trim();
    if (!name) errs.name = "Please enter your name.";
    if (!email) errs.email = "Please enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "That email doesn’t look right.";
    if (!subject) errs.subject = "Add a short subject.";
    if (!message) errs.message = "Please write a message.";
    else if (message.length < 10) errs.message = "A little more detail, please (10+ characters).";
    return errs;
  }
  function clearErrors(form) {
    form.querySelectorAll(".contact-field__input").forEach(function (i) { i.classList.remove("contact-field__input--error"); });
    form.querySelectorAll(".contact-field__error").forEach(function (e) { e.remove(); });
  }
  function showErrors(form, errs) {
    Object.keys(errs).forEach(function (k) {
      var wrap = form.querySelector('[data-field="' + k + '"]');
      var input = wrap.querySelector(".contact-field__input");
      input.classList.add("contact-field__input--error");
      var e = document.createElement("div");
      e.className = "contact-field__error";
      e.innerHTML = ICONS.get("alert", 14) + "<span>" + errs[k] + "</span>";
      wrap.appendChild(e);
    });
    var first = form.querySelector(".contact-field__input--error"); if (first) first.focus();
  }
})();
