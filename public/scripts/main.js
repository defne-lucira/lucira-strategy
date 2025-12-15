// src/main.js

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const statusEl = form.querySelector('.form-status');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    // basic validation
    if (!data.name || !data.email || !data.message) {
      statusEl.textContent = 'Please fill in name, email, and message.';
      return;
    }

    // lock UI
    submitBtn.disabled = true;
    form.classList.add('is-submitting');
    statusEl.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const payload = await res.json().catch(() => ({}));

      if (res.ok && payload.ok) {
        statusEl.textContent = 'Thanks — we’ll be in touch shortly.';
        form.reset();
      } else {
        statusEl.textContent = payload.error || 'Something went wrong. Please try again.';
      }
    } catch (err) {
      statusEl.textContent = 'Network error. Please try again.';
    } finally {
      submitBtn.disabled = false;
      form.classList.remove('is-submitting');
    }
  });
});

