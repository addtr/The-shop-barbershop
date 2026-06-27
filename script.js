/* ============================================================
   THE SHOP BARBERSHOP — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initHamburger();
  initBookingForm();
});

/* ── NAVBAR ─────────────────────────────────────────────── */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  const onScroll = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ── HAMBURGER ──────────────────────────────────────────── */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;
  btn.addEventListener('click', () => {
    btn.classList.toggle('open');
    links.classList.toggle('open');
  });
  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      btn.classList.remove('open');
      links.classList.remove('open');
    });
  });
}

/* ── BOOKING FORM ───────────────────────────────────────── */
function initBookingForm() {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  let currentStep = 1;
  const totalSteps = 4;

  // Next buttons
  form.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = parseInt(btn.dataset.next);
      if (validateStep(currentStep)) {
        goToStep(next);
      }
    });
  });

  // Back buttons
  form.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(parseInt(btn.dataset.prev));
    });
  });

  // Service options — highlight selected
  form.querySelectorAll('.service-option input').forEach(radio => {
    radio.addEventListener('change', () => updateSummary());
  });
  form.querySelectorAll('.barber-option input').forEach(radio => {
    radio.addEventListener('change', () => updateSummary());
  });

  // Date min = today
  const dateInput = document.getElementById('apptDate');
  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.min = `${yyyy}-${mm}-${dd}`;
    dateInput.addEventListener('change', () => {
      filterTimesByDay(dateInput.value);
      updateSummary();
    });
  }

  document.getElementById('apptTime')?.addEventListener('change', updateSummary);

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (validateStep(4)) {
      showConfirmation();
    }
  });

  function goToStep(step) {
    document.getElementById(`step${currentStep}`)?.classList.add('hidden');
    document.getElementById(`step${step}`)?.classList.remove('hidden');

    // Update step indicators
    document.querySelectorAll('.step').forEach(s => {
      const n = parseInt(s.dataset.step);
      s.classList.remove('active', 'completed');
      if (n === step) s.classList.add('active');
      if (n < step) s.classList.add('completed');
    });

    currentStep = step;
    if (step === 4) updateSummary();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(step) {
    let valid = true;

    if (step === 1) {
      valid = validateField('firstName', 'firstNameErr', 'First name is required') && valid;
      valid = validateField('lastName', 'lastNameErr', 'Last name is required') && valid;
      valid = validateEmail('email', 'emailErr') && valid;
      valid = validateField('phone', 'phoneErr', 'Phone number is required') && valid;
    }

    if (step === 2) {
      const selected = form.querySelector('input[name="service"]:checked');
      const err = document.getElementById('serviceErr');
      if (!selected) {
        err.textContent = 'Please select a service';
        valid = false;
      } else {
        err.textContent = '';
      }
    }

    if (step === 3) {
      const selected = form.querySelector('input[name="barber"]:checked');
      const err = document.getElementById('barberErr');
      if (!selected) {
        err.textContent = 'Please select a barber or "No Preference"';
        valid = false;
      } else {
        err.textContent = '';
      }
    }

    if (step === 4) {
      valid = validateField('apptDate', 'dateErr', 'Please select a date') && valid;
      valid = validateSelect('apptTime', 'timeErr', 'Please select a time') && valid;
      const policy = document.getElementById('agreePolicy');
      const policyErr = document.getElementById('policyErr');
      if (policy && !policy.checked) {
        policyErr.textContent = 'You must agree to the cancellation policy';
        valid = false;
      } else if (policyErr) {
        policyErr.textContent = '';
      }
    }

    return valid;
  }

  function validateField(id, errId, msg) {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return true;
    const ok = el.value.trim().length > 0;
    err.textContent = ok ? '' : msg;
    el.closest('.form-group')?.classList.toggle('error', !ok);
    return ok;
  }

  function validateEmail(id, errId) {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return true;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
    err.textContent = ok ? '' : 'Please enter a valid email address';
    el.closest('.form-group')?.classList.toggle('error', !ok);
    return ok;
  }

  function validateSelect(id, errId, msg) {
    const el = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return true;
    const ok = el.value.length > 0;
    err.textContent = ok ? '' : msg;
    return ok;
  }

  function filterTimesByDay(dateStr) {
    if (!dateStr) return;
    const d = new Date(dateStr + 'T00:00:00');
    const dow = d.getDay(); // 0=Sun,1=Mon,...,6=Sat
    const select = document.getElementById('apptTime');
    if (!select) return;

    // Sun = closed
    if (dow === 0) {
      select.innerHTML = '<option value="">We are closed on Sundays</option>';
      return;
    }

    const slots = [
      '10:00 AM','10:30 AM','11:00 AM','11:30 AM',
      '12:00 PM','12:30 PM','1:00 PM','1:30 PM',
      '2:00 PM','2:30 PM','3:00 PM','3:30 PM',
      '4:00 PM','4:30 PM','5:00 PM'
    ];

    // Mon closes 5:30PM, Thu closes 6:30PM, Tue/Wed/Fri/Sat 7PM
    if (dow !== 1) slots.push('5:30 PM');
    if (dow === 4 || dow === 2 || dow === 3 || dow === 5 || dow === 6) slots.push('6:00 PM');
    if (dow !== 1 && dow !== 4) slots.push('6:30 PM');

    select.innerHTML = '<option value="">Select a time</option>' +
      slots.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  function updateSummary() {
    const rows = document.getElementById('summaryRows');
    if (!rows) return;

    const firstName = document.getElementById('firstName')?.value || '';
    const lastName = document.getElementById('lastName')?.value || '';
    const service = form.querySelector('input[name="service"]:checked');
    const barber = form.querySelector('input[name="barber"]:checked');
    const date = document.getElementById('apptDate')?.value || '';
    const time = document.getElementById('apptTime')?.value || '';

    const formatDate = (str) => {
      if (!str) return '';
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    rows.innerHTML = `
      ${firstName ? `<div class="summary-row"><span class="label">Name</span><span class="value">${firstName} ${lastName}</span></div>` : ''}
      ${service ? `<div class="summary-row"><span class="label">Service</span><span class="value">${service.value}</span></div>` : ''}
      ${service ? `<div class="summary-row total"><span class="label">Price</span><span class="value">${service.dataset.price}</span></div>` : ''}
      ${barber ? `<div class="summary-row"><span class="label">Barber</span><span class="value">${barber.value}</span></div>` : ''}
      ${date ? `<div class="summary-row"><span class="label">Date</span><span class="value">${formatDate(date)}</span></div>` : ''}
      ${time ? `<div class="summary-row"><span class="label">Time</span><span class="value">${time}</span></div>` : ''}
    `;
  }

  function showConfirmation() {
    const service = form.querySelector('input[name="service"]:checked');
    const barber = form.querySelector('input[name="barber"]:checked');
    const firstName = document.getElementById('firstName')?.value || '';
    const lastName = document.getElementById('lastName')?.value || '';
    const date = document.getElementById('apptDate')?.value || '';
    const time = document.getElementById('apptTime')?.value || '';

    const formatDate = (str) => {
      if (!str) return '';
      const d = new Date(str + 'T00:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const barberPhone = barber?.dataset.phone || '(802) 557-2497';

    document.getElementById('confirmText').textContent =
      `Thank you, ${firstName}! Your appointment request has been received. ${barber?.value && barber.value !== 'No Preference' ? barber.value : 'Your barber'} will confirm via phone or text at ${barberPhone} shortly.`;

    document.getElementById('modalDetails').innerHTML = `
      <div class="detail-row"><span class="label">Name</span><span class="value">${firstName} ${lastName}</span></div>
      ${service ? `<div class="detail-row"><span class="label">Service</span><span class="value">${service.value}</span></div>` : ''}
      ${service ? `<div class="detail-row"><span class="label">Price</span><span class="value">${service.dataset.price}</span></div>` : ''}
      ${barber ? `<div class="detail-row"><span class="label">Barber</span><span class="value">${barber.value}</span></div>` : ''}
      ${date ? `<div class="detail-row"><span class="label">Date</span><span class="value">${formatDate(date)}</span></div>` : ''}
      ${time ? `<div class="detail-row"><span class="label">Time</span><span class="value">${time}</span></div>` : ''}
    `;

    document.getElementById('confirmModal')?.classList.add('active');
  }
}
