/* MORAI · interacciones del sitio (menú móvil y modal "Solicitar demo"). */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  // --- Menú móvil ------------------------------------------------------------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('menu-principal');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
  }

  // --- Formularios -------------------------------------------------------------
  function syncPlans(form) {
    var producto = form.querySelector('[data-producto]');
    var plan = form.querySelector('[data-plan]');
    if (!producto || !plan) return;
    var groups = plan.querySelectorAll('optgroup');
    var hasVisible = false;
    groups.forEach(function (g) {
      var match = !producto.value || g.getAttribute('data-group') === producto.value;
      g.hidden = !match;
      g.disabled = !match;
      if (match) hasVisible = true;
    });
    var selected = plan.selectedOptions[0];
    if (selected && selected.parentElement && selected.parentElement.disabled) plan.value = '';
    plan.closest('.field').hidden = !hasVisible || producto.value === 'otro';
  }

  function clearErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach(function (el) { el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
    var alert = form.querySelector('[data-form-alert]');
    if (alert) { alert.hidden = true; alert.textContent = ''; }
  }

  function showErrors(form, message, errors) {
    var alert = form.querySelector('[data-form-alert]');
    if (alert && message) { alert.textContent = message; alert.hidden = false; }
    var first = null;
    Object.keys(errors || {}).forEach(function (name) {
      var slot = form.querySelector('[data-error-for="' + name + '"]');
      if (slot) slot.textContent = errors[name];
      var input = form.elements[name];
      if (input && input.setAttribute) {
        input.setAttribute('aria-invalid', 'true');
        if (!first) first = input;
      }
    });
    if (first && first.focus) first.focus();
  }

  function validateLocally(form) {
    var errors = {};
    var f = form.elements;
    if (f.nombre.value.trim().length < 2) errors.nombre = 'Ingresa tu nombre.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value.trim())) errors.email = 'Ingresa un correo válido.';
    var tel = f.telefono.value.trim();
    if (tel && !/^\+?[\d\s()-]{6,25}$/.test(tel)) errors.telefono = 'Ingresa un teléfono válido.';
    if (!f.producto.value) errors.producto = 'Elige un producto.';
    if (!f.consentimiento.checked) errors.consentimiento = 'Debes aceptar la política de privacidad.';
    return errors;
  }

  document.querySelectorAll('[data-demo-form]').forEach(function (form) {
    var producto = form.querySelector('[data-producto]');
    if (producto) producto.addEventListener('change', function () { syncPlans(form); });
    syncPlans(form);

    form.addEventListener('submit', function (ev) {
      if (!window.fetch) return; // envío clásico
      ev.preventDefault();
      clearErrors(form);
      var local = validateLocally(form);
      if (Object.keys(local).length) {
        showErrors(form, 'Revisa los campos marcados.', local);
        return;
      }
      var button = form.querySelector('[data-submit]');
      var label = button.textContent;
      button.disabled = true;
      button.textContent = 'Enviando…';

      var data = {};
      new FormData(form).forEach(function (value, key) { data[key] = value; });
      data.consentimiento = form.elements.consentimiento.checked;

      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (body) { return { status: res.status, body: body }; });
        })
        .then(function (r) {
          if (r.status === 200 && r.body.ok) {
            window.location.href = r.body.redirect || '/gracias';
            return;
          }
          showErrors(form, r.body.message || 'No pudimos enviar tu solicitud. Inténtalo nuevamente.', r.body.errors);
          button.disabled = false;
          button.textContent = label;
        })
        .catch(function () {
          showErrors(form, 'Sin conexión. Revisa tu internet e inténtalo nuevamente.');
          button.disabled = false;
          button.textContent = label;
        });
    });
  });

  // --- Modal "Solicitar demo" --------------------------------------------------
  var modal = document.getElementById('demo-modal');
  if (!modal || typeof modal.showModal !== 'function') return; // sin soporte: los CTA navegan a /contacto
  var modalForm = modal.querySelector('[data-demo-form]');
  var sub = modal.querySelector('[data-modal-sub]');
  var defaultSub = sub ? sub.textContent : '';
  var lastTrigger = null;

  document.addEventListener('click', function (ev) {
    var trigger = ev.target.closest('[data-demo]');
    if (!trigger) return;
    // En la propia página de contacto basta con llevar al formulario.
    if (document.body.classList.contains('page-contacto')) return;
    ev.preventDefault();
    lastTrigger = trigger;
    var producto = trigger.getAttribute('data-demo') || '';
    var plan = trigger.getAttribute('data-plan') || '';
    clearErrors(modalForm);
    if (producto) modalForm.elements.producto.value = producto;
    syncPlans(modalForm);
    if (plan) modalForm.elements.plan.value = plan;
    if (sub) {
      var opt = modalForm.elements.producto.selectedOptions[0];
      sub.textContent = producto && opt ? 'Te interesa: ' + opt.textContent.trim() : defaultSub;
    }
    if (nav) nav.classList.remove('is-open');
    modal.showModal();
    var first = modalForm.elements.nombre;
    if (first) first.focus();
  });

  modal.querySelector('[data-modal-close]').addEventListener('click', function () { modal.close(); });
  modal.addEventListener('click', function (ev) {
    if (ev.target === modal) modal.close(); // clic en el fondo
  });
  modal.addEventListener('close', function () {
    if (lastTrigger) lastTrigger.focus();
  });
})();
