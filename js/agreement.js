const gbNow = () => new Date().toLocaleString('en-GB', { timeZone: 'Europe/London', hour12: false });
const $ = (id) => document.getElementById(id);

const saveIndicator = $('saveIndicator');

const indicateSaved = () => {
  if (!saveIndicator) return;
  saveIndicator.textContent = 'Saved';
  saveIndicator.setAttribute('data-state', 'saved');
  window.setTimeout(() => {
    saveIndicator.textContent = '';
    saveIndicator.removeAttribute('data-state');
  }, 1200);
};

const indicateError = () => {
  if (!saveIndicator) return;
  saveIndicator.textContent = 'Save failed';
  saveIndicator.setAttribute('data-state', 'error');
  window.setTimeout(() => {
    saveIndicator.textContent = '';
    saveIndicator.removeAttribute('data-state');
  }, 1500);
};

const setBind = (key, val) => {
  document.querySelectorAll(`[data-bind="${key}"]`).forEach((el) => {
    el.textContent = val ?? '';
  });
};

const toOrdinal = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return '';
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const debounce = (fn, wait = 300) => {
  let timer;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
};

const FORM_KEY = 'tenancyForm_v3';
const SIG_KEYS = {
  tenant: 'sig_tenant',
  witness: 'sig_witness',
};
const MAX_SUBS = 2;

const rentDaySelect = $('rentDay');
if (rentDaySelect) {
  const options = Array.from({ length: 28 }, (_, i) => i + 1);
  options.forEach((day) => {
    const opt = document.createElement('option');
    opt.value = String(day);
    opt.textContent = String(day);
    if (day === 14) opt.selected = true;
    rentDaySelect.appendChild(opt);
  });
}

const today = new Date();
const agreeDateInput = $('agreeDate');
const startDateInput = $('startDate');
if (agreeDateInput) {
  agreeDateInput.value = today.toISOString().slice(0, 10);
}
if (startDateInput) {
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  startDateInput.value = nextWeek.toISOString().slice(0, 10);
}

const els = {
  agreeDate: $('agreeDate'),
  startDate: $('startDate'),
  tenantName: $('tenantName'),
  agent: $('agent'),
  rent: $('rent'),
  rentDay: $('rentDay'),
  witName: $('witName'),
  imgTenant: $('imgTenant'),
  imgWit: $('imgWit'),
  stampTenant: $('stampTenant'),
  stampWit: $('stampWit'),
  errAgreeDate: $('errAgreeDate'),
  errStartDate: $('errStartDate'),
  errRent: $('errRent'),
  subsContainer: $('subsContainer'),
  sigContainer: $('sigContainer'),
  signingSubs: $('signingSubs'),
};

const validateRentField = () => {
  const rentValue = Number(els.rent?.value || 0);
  showError(els.rent, els.errRent, !(rentValue >= 1));
};

els.agreeDate?.addEventListener('change', () => {
  showError(els.agreeDate, els.errAgreeDate, !els.agreeDate?.value);
});

els.startDate?.addEventListener('change', () => {
  showError(els.startDate, els.errStartDate, !els.startDate?.value);
});

els.rent?.addEventListener('input', validateRentField);
els.rent?.addEventListener('blur', validateRentField);

function showError(el, errEl, condition) {
  if (!errEl || !el) return true;
  if (condition) {
    errEl.style.display = 'block';
    el.setAttribute('aria-invalid', 'true');
    el.style.borderColor = 'var(--danger)';
    return false;
  }
  errEl.style.display = 'none';
  el.removeAttribute('aria-invalid');
  el.style.borderColor = '';
  return true;
}

function validateSubs(subs) {
  if (!subs.length) return false;
  const first = subs[0];
  const nameEl = $(`subName_${first.index}`);
  const addrEl = $(`subAddr_${first.index}`);
  const v1 = showError(nameEl, $(`errSubName_${first.index}`), !nameEl?.value.trim());
  const v2 = showError(addrEl, $(`errSubAddr_${first.index}`), !addrEl?.value.trim());
  return v1 && v2;
}

function validateForm(subs) {
  const rentValue = Number(els.rent?.value || 0);
  const v1 = showError(els.agreeDate, els.errAgreeDate, !els.agreeDate?.value);
  const v2 = showError(els.startDate, els.errStartDate, !els.startDate?.value);
  const v3 = showError(els.rent, els.errRent, !(rentValue >= 1));
  const v4 = validateSubs(subs);
  return v1 && v2 && v3 && v4;
}

function createSignaturePad({ canvasId, timeSpanId, stampOutputId, storageKey, imgId }) {
  const canvas = $(canvasId);
  if (!canvas) return null;
  const ctx = canvas.getContext('2d');
  const timeEl = timeSpanId ? $(timeSpanId) : null;
  const stampOut = stampOutputId ? $(stampOutputId) : null;
  const imgEl = imgId ? $(imgId) : null;
  let drawing = false;
  let hasInk = false;
  let last = { x: 0, y: 0 };

  const ratio = Math.max(window.devicePixelRatio || 1, 1);

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const heightCss = 160;
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(heightCss * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    ctx.clearRect(0, 0, rect.width, heightCss);
  }

  resize();
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener('resize', resize);
  }

  function pointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    hasInk = true;
    last = pointerPos(e);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last = { x, y };
  }

  function end() {
    drawing = false;
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end, { passive: false });

  function clearSig({ confirmClear = true, preserveStorage = false } = {}) {
    if (confirmClear && hasInk && !window.confirm('Clear this signature?')) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111';
    hasInk = false;
    if (timeEl) timeEl.textContent = 'No timestamp yet';
    if (stampOut) stampOut.textContent = '[Signature and UK timestamp]';
    if (!preserveStorage) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
    }
    if (imgEl) {
      imgEl.removeAttribute('src');
      imgEl.style.display = 'none';
    }
    if (!preserveStorage) {
      indicateSaved();
    }
  }

  function stamp() {
    const ts = gbNow();
    if (timeEl) timeEl.textContent = `Signed ${ts} (UK)`;
    if (stampOut) stampOut.textContent = `${ts} (UK)`;
  }

  function persist() {
    if (!hasInk) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      localStorage.setItem(storageKey, dataUrl);
      if (imgEl) {
        imgEl.src = dataUrl;
        imgEl.style.display = 'block';
      }
      indicateSaved();
    } catch (e) {
      indicateError();
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const image = new Image();
      image.onload = () => {
        clearSig({ confirmClear: false, preserveStorage: true });
        ctx.drawImage(image, 0, 0, canvas.width / ratio, canvas.height / ratio);
        hasInk = true;
        if (imgEl) {
          imgEl.src = stored;
          imgEl.style.display = 'block';
        }
      };
      image.src = stored;
    } catch (e) {
      // ignore
    }
  }

  function applyToImage() {
    if (!hasInk || !imgEl) return;
    imgEl.src = canvas.toDataURL('image/png');
    imgEl.style.display = 'block';
  }

  return {
    canvas,
    clearSig,
    stamp,
    persist,
    loadFromStorage,
    applyToImage,
    get hasInk() {
      return hasInk;
    },
  };
}

function handleUpload(inputEl, imgEl, storageKey) {
  if (!inputEl || !imgEl) return;
  inputEl.addEventListener('change', () => {
    const file = inputEl.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      imgEl.src = reader.result;
      imgEl.style.display = 'block';
      try {
        localStorage.setItem(storageKey, reader.result);
        indicateSaved();
      } catch (e) {
        indicateError();
      }
    };
    reader.readAsDataURL(file);
  });
}

let subs = [];

function newSub(index) {
  return {
    index,
    name: '',
    addr: '',
    sigKey: `sig_sub_${index}`,
    tsId: `stampSub${index}`,
  };
}

function renderSubs() {
  if (!subs.length) subs.push(newSub(0));
  if (subs.length > MAX_SUBS) subs = subs.slice(0, MAX_SUBS);

  if (els.subsContainer) els.subsContainer.innerHTML = '';
  if (els.sigContainer) els.sigContainer.innerHTML = '';
  if (els.signingSubs) els.signingSubs.innerHTML = '';

  subs.forEach((sub, idx) => {
    const card = document.createElement('div');
    card.className = 'card sub-card';
    card.innerHTML = `
      <h4 class="sub-card__title">Sub-Tenant ${idx + 1}${idx === 0 ? ' (required)' : ''}</h4>
      <label class="required" for="subName_${sub.index}">Full Name</label>
      <input type="text" id="subName_${sub.index}" placeholder="Full legal name" aria-required="${idx === 0 ? 'true' : 'false'}" aria-describedby="errSubName_${sub.index}">
      <div id="errSubName_${sub.index}" class="error" role="alert">Please enter the sub-tenant’s full name.</div>
      <label class="required" for="subAddr_${sub.index}">Current Address</label>
      <textarea id="subAddr_${sub.index}" placeholder="Address" aria-required="${idx === 0 ? 'true' : 'false'}" aria-describedby="errSubAddr_${sub.index}"></textarea>
      <div id="errSubAddr_${sub.index}" class="error" role="alert">Please enter the sub-tenant’s address.</div>
    `;
    els.subsContainer?.appendChild(card);

    const sigWrapper = document.createElement('div');
    sigWrapper.innerHTML = `
      <label>Sub-Tenant ${idx + 1} Signature</label>
      <div class="sig-pad"><canvas id="sigSub_${sub.index}"></canvas></div>
      <div class="sig-tools">
        <button class="btn" id="sigSubClear_${sub.index}" type="button">Clear</button>
        <button class="btn" id="sigSubStamp_${sub.index}" type="button">Stamp time</button>
        <span id="sigSubTime_${sub.index}" class="hint" aria-live="polite">No timestamp yet</span>
      </div>
      <div class="upload">
        <label class="file-label" for="sigSubUpload_${sub.index}">Upload signature image</label>
        <input id="sigSubUpload_${sub.index}" type="file" accept="image/*">
        <span class="hint">Upload PNG or JPG</span>
      </div>
      <div class="hr"></div>
    `;
    els.sigContainer?.appendChild(sigWrapper);

    const signing = document.createElement('div');
    signing.className = 'sig-block';
    signing.innerHTML = `
      <p><strong>${idx === 0 ? 'Sub-Tenant' : 'Co-Sub-Tenant'}:</strong> <span data-bind="subTenant${idx}">[Name]</span></p>
      <img id="imgSub_${sub.index}" class="sig-img" alt="Sub-Tenant signature ${idx + 1}">
      <div class="sig-line"></div>
      <div class="printed-name">Printed name: <span data-bind="subTenant${idx}">[Name]</span></div>
      <p class="stamp">Signed and dated: <span id="${sub.tsId}">[Signature and UK timestamp]</span></p>
    `;
    els.signingSubs?.appendChild(signing);
  });

  subs.forEach((sub, idx) => {
    const nameField = $(`subName_${sub.index}`);
    const addrField = $(`subAddr_${sub.index}`);
    if (nameField) nameField.value = sub.name || '';
    if (addrField) addrField.value = sub.addr || '';

    const save = debounce(saveForm, 500);
    nameField?.addEventListener('input', save);
    addrField?.addEventListener('input', save);

    nameField?.addEventListener('blur', () => {
      if (idx === 0) showError(nameField, $(`errSubName_${sub.index}`), !nameField.value.trim());
    });
    addrField?.addEventListener('blur', () => {
      if (idx === 0) showError(addrField, $(`errSubAddr_${sub.index}`), !addrField.value.trim());
    });
  });

  subs.forEach((sub) => {
    sub.sig = createSignaturePad({
      canvasId: `sigSub_${sub.index}`,
      timeSpanId: `sigSubTime_${sub.index}`,
      stampOutputId: sub.tsId,
      storageKey: sub.sigKey,
      imgId: `imgSub_${sub.index}`,
    });
    $(`sigSubClear_${sub.index}`)?.addEventListener('click', () => sub.sig?.clearSig());
    $(`sigSubStamp_${sub.index}`)?.addEventListener('click', () => sub.sig?.stamp());
    handleUpload($(`sigSubUpload_${sub.index}`), $(`imgSub_${sub.index}`), sub.sigKey);
    sub.sig?.loadFromStorage();
  });
}

function saveForm() {
  try {
    subs.forEach((sub) => {
      sub.name = $(`subName_${sub.index}`)?.value || '';
      sub.addr = $(`subAddr_${sub.index}`)?.value || '';
    });
    const data = {
      agreeDate: els.agreeDate?.value,
      startDate: els.startDate?.value,
      rent: els.rent?.value,
      rentDay: els.rentDay?.value,
      witName: els.witName?.value,
      subs: subs.map((sub) => ({
        index: sub.index,
        name: $(`subName_${sub.index}`)?.value || '',
        addr: $(`subAddr_${sub.index}`)?.value || '',
        sigKey: sub.sigKey,
        tsId: sub.tsId,
      })),
    };
    localStorage.setItem(FORM_KEY, JSON.stringify(data));
    indicateSaved();
  } catch (e) {
    indicateError();
  }
}

function loadForm() {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (!raw) {
      subs = [newSub(0)];
      renderSubs();
      return;
    }
    const data = JSON.parse(raw);
    subs = Array.isArray(data.subs) && data.subs.length
      ? data.subs.map((s, idx) => ({
        index: typeof s.index === 'number' ? s.index : idx,
        name: s.name || '',
        addr: s.addr || '',
        sigKey: s.sigKey || `sig_sub_${idx}`,
        tsId: s.tsId || `stampSub${idx}`,
      }))
      : [newSub(0)];
    renderSubs();
    if (data.agreeDate && els.agreeDate) els.agreeDate.value = data.agreeDate;
    if (data.startDate && els.startDate) els.startDate.value = data.startDate;
    if (data.rent && els.rent) els.rent.value = data.rent;
    if (data.rentDay && els.rentDay) els.rentDay.value = data.rentDay;
    if (data.witName && els.witName) els.witName.value = data.witName;
    subs.forEach((sub) => {
      const nameField = $(`subName_${sub.index}`);
      const addrField = $(`subAddr_${sub.index}`);
      if (nameField) nameField.value = sub.name || '';
      if (addrField) addrField.value = sub.addr || '';
    });
  } catch (e) {
    subs = [newSub(0)];
    renderSubs();
  }
}

function bindAgreement() {
  const agreeDate = els.agreeDate?.value ? new Date(els.agreeDate.value).toLocaleDateString('en-GB') : '';
  setBind('agreeDate', agreeDate);
  const startDate = els.startDate?.value ? new Date(els.startDate.value).toLocaleDateString('en-GB') : '';
  setBind('startDate', startDate);
  setBind('tenantName', els.tenantName?.value || '');
  setBind('agent', els.agent?.value || '');
  const rent = Number(els.rent?.value || 0);
  setBind('rent', rent ? String(rent) : '0');
  const rentDayVal = Number(els.rentDay?.value || 0);
  const rentDay = rentDayVal ? String(rentDayVal) : '';
  setBind('rentDay', rentDay);
  setBind('rentDayOrdinal', rentDayVal ? toOrdinal(rentDayVal) : '');
  setBind('notice', '28 days');
  const initTotal = rent * 2;
  setBind('initTotal', initTotal ? String(initTotal) : '0');

  subs.forEach((sub, idx) => {
    const nameValue = $(`subName_${sub.index}`)?.value.trim() || `[Sub-Tenant ${idx + 1}]`;
    const addrValue = $(`subAddr_${sub.index}`)?.value.trim() || `[Address ${idx + 1}]`;
    setBind(`subTenant${idx}`, nameValue);
    setBind(`subTenantAddr${idx}`, addrValue);
  });

  document.querySelectorAll('[data-if="hasSub1"]').forEach((el) => {
    el.style.display = subs.length > 1 ? 'inline' : 'none';
  });

  const witnessName = els.witName?.value.trim() || '[Witness]';
  $('bindWitName').textContent = witnessName;
  $('bindWitName2').textContent = witnessName;
}

function prepareForPrint() {
  subs.forEach((sub) => {
    const img = $(`imgSub_${sub.index}`);
    sub.sig?.applyToImage();
    if (!sub.sig?.hasInk && img) {
      img.style.display = 'none';
    }
  });
  tenantSig?.applyToImage();
  witnessSig?.applyToImage();
}

const formatEmailDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB');
};

function emailDavid() {
  const names = subs
    .map((sub, idx) => {
      const name = $(`subName_${sub.index}`)?.value.trim();
      return name || `Sub-Tenant ${idx + 1}`;
    })
    .join(' & ');
  const subject = encodeURIComponent(`Sub-Tenancy Agreement — ${names}`);
  const agreementDate = formatEmailDate(els.agreeDate?.value) || '[date]';
  const startDate = formatEmailDate(els.startDate?.value) || '[start date]';
  const rentValue = Number(els.rent?.value || 0);
  const rentDisplay = rentValue ? `£${rentValue}` : '£[rent]';
  const initTotal = rentValue ? `£${rentValue * 2}` : '£[initial total]';
  const rentDueDay = els.rentDay?.value ? toOrdinal(Number(els.rentDay.value)) : '[Due Day]';

  const partiesSection = `This Sub-Tenancy Agreement (“the Agreement”) is made on ${agreementDate} between:\n1. David Martin (“the Tenant” or “lead tenant”), the primary tenant and current occupier who rents the property from the landlord through Milard’s Property Management and has written permission to sub-let one room in the property; and\n2. ${names} (“the Sub-Tenant”).`;

  const initialPaymentsSection = `Initial Payments (no deposit):\n- The Sub-Tenant(s) agree to pay first and last month’s rent upfront on signing. The initial total is ${initTotal}. There is no separate tenancy deposit. The last month’s rent is applied to the final month of the tenancy.\n- Rent is charged by whole calendar month and is not refunded pro-rata. If the Sub-Tenant(s) choose to leave part-way through a paid month, or leave before the end of the required 28 days’ notice period, the rent already paid for that month will remain payable in full.\n- After departure at the end of the tenancy, reasonable charges for any damage beyond fair wear and tear, professional cleaning if required, or unpaid utilities may be recovered from rent paid in advance. Receipts or reasonable evidence will be provided for any such deductions, and any remaining balance will be returned to the Sub-Tenant(s).`;

  const endingSection = `Ending the Agreement:\n- Either party may end this Agreement by giving at least 28 days written notice. Four to six weeks’ notice is preferred where possible.\n- On leaving, return all keys/fobs and leave the room and shared areas clean and undamaged, allowing for fair wear and tear.\n- Rent is payable by full calendar month. Where the Sub-Tenant(s) choose to leave during a month that has already been paid for, no pro-rata refund of that month’s rent will be due.`;

  const generalSection = `General:\n- This Agreement constitutes the entire understanding between the parties and supersedes prior agreements. Any amendments must be in writing and signed by both parties. This Agreement is governed by the laws of Scotland. The parties will attempt to resolve disputes amicably before formal action.\n- The landlord and managing agent are not parties to this Sub-Tenancy Agreement. Day-to-day issues and communications under this Agreement are between the lead tenant and the Sub-Tenant(s), except where the law requires the landlord or managing agent to become involved.`;

  const body = encodeURIComponent(
    `Hi David,

The sub-tenancy agreement is completed for ${names}.

Property: Flat 1, 61 Caledonian Crescent, Edinburgh
Agreement date: ${agreementDate}
Start Date: ${startDate}
Monthly Rent: ${rentDisplay}
Rent Due Day: ${rentDueDay}

${partiesSection}

${initialPaymentsSection}

${endingSection}

${generalSection}

I’ve attached the PDF (or will send it next).

Thanks.`
  );
  window.location.href = `mailto:david.martin.1296@gmail.com?subject=${subject}&body=${body}`;
}

function clearForm() {
  if (!window.confirm('Clear all form fields (signatures are kept unless you clear them individually)?')) return;
  try {
    localStorage.removeItem(FORM_KEY);
  } catch (e) {
    // ignore
  }
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  if (els.agreeDate) els.agreeDate.value = today.toISOString().slice(0, 10);
  if (els.startDate) els.startDate.value = nextWeek.toISOString().slice(0, 10);
  if (els.rent) els.rent.value = '750';
  if (els.rentDay) els.rentDay.value = '14';
  if (els.witName) els.witName.value = '';
  subs = [newSub(0)];
  renderSubs();
  bindAgreement();
}

function scrollToTop(e) {
  if (e) e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

['agreeDate', 'startDate', 'rent', 'rentDay', 'witName'].forEach((id) => {
  const el = $(id);
  if (!el) return;
  el.addEventListener('input', debounce(saveForm, 500));
  el.addEventListener('blur', saveForm);
  if (el.tagName === 'SELECT') {
    el.addEventListener('change', saveForm);
  }
});

if (els.witName) {
  els.witName.addEventListener('input', () => {
    const witness = els.witName.value.trim() || '[Witness]';
    $('bindWitName').textContent = witness;
    $('bindWitName2').textContent = witness;
  });
}

loadForm();
bindAgreement();

$('btnAddSub')?.addEventListener('click', () => {
  if (subs.length >= MAX_SUBS) {
    window.alert('You can add up to two sub-tenants.');
    return;
  }
  const sub = newSub(subs.length ? subs[subs.length - 1].index + 1 : 0);
  subs.push(sub);
  renderSubs();
  saveForm();
});

$('btnRemoveSub')?.addEventListener('click', () => {
  if (subs.length <= 1) {
    window.alert('At least one sub-tenant is required.');
    return;
  }
  const removed = subs.pop();
  try {
    localStorage.removeItem(removed.sigKey);
  } catch (e) {
    // ignore
  }
  renderSubs();
  saveForm();
});

$('btnGenerate')?.addEventListener('click', () => {
  if (!validateForm(subs)) return;
  bindAgreement();
  subs.forEach((sub) => sub.sig?.persist());
  tenantSig?.persist();
  witnessSig?.persist();
  const preview = $('preview');
  if (preview) {
    window.scrollTo({ top: preview.offsetTop - 8, behavior: 'smooth' });
  }
});

$('btnPrint')?.addEventListener('click', () => {
  bindAgreement();
  prepareForPrint();
  window.print();
});
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-pdf-button');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      bindAgreement();
      prepareForPrint();
      window.print();
    });
  }
});

$('btnEmail')?.addEventListener('click', emailDavid);
$('btnEmailBottom')?.addEventListener('click', emailDavid);
$('btnClear')?.addEventListener('click', clearForm);
$('btnScrollTop')?.addEventListener('click', scrollToTop);

const tenantSig = createSignaturePad({
  canvasId: 'sigTenant',
  timeSpanId: 'sigTenantTime',
  stampOutputId: 'stampTenant',
  storageKey: SIG_KEYS.tenant,
  imgId: 'imgTenant',
});
const witnessSig = createSignaturePad({
  canvasId: 'sigWitness',
  timeSpanId: 'sigWitTime',
  stampOutputId: 'stampWit',
  storageKey: SIG_KEYS.witness,
  imgId: 'imgWit',
});

tenantSig?.loadFromStorage();
witnessSig?.loadFromStorage();

$('sigTenantClear')?.addEventListener('click', () => tenantSig?.clearSig());
$('sigTenantStamp')?.addEventListener('click', () => tenantSig?.stamp());
$('sigWitClear')?.addEventListener('click', () => witnessSig?.clearSig());
$('sigWitStamp')?.addEventListener('click', () => witnessSig?.stamp());

handleUpload($('sigTenantUpload'), els.imgTenant, SIG_KEYS.tenant);
handleUpload($('sigWitUpload'), els.imgWit, SIG_KEYS.witness);

window.addEventListener('beforeprint', () => {
  bindAgreement();
  prepareForPrint();
});

window.addEventListener('afterprint', () => {
  subs.forEach((sub) => {
    const img = $(`imgSub_${sub.index}`);
    if (img && !sub.sig?.hasInk) {
      img.style.display = 'none';
    }
  });
});

const navLinks = Array.from(document.querySelectorAll('.glass-nav a'));
const navTargets = navLinks
  .map((link) => {
    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return null;
    const id = hash.slice(1);
    const section = document.getElementById(id);
    if (!section) return null;
    return { link, section };
  })
  .filter(Boolean);

if (navTargets.length) {
  const setActiveNav = () => {
    const scrollPos = window.scrollY + 120;
    let activeId = navTargets[0].section.id;
    navTargets.forEach(({ section }) => {
      if (section.offsetTop <= scrollPos) {
        activeId = section.id;
      }
    });
    navTargets.forEach(({ link, section }) => {
      if (section.id === activeId) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  };

  const debouncedSetActive = debounce(setActiveNav, 100);
  window.addEventListener('scroll', debouncedSetActive, { passive: true });
  window.addEventListener('resize', debouncedSetActive);
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((lnk) => lnk.removeAttribute('aria-current'));
      link.setAttribute('aria-current', 'true');
    });
  });
  setActiveNav();
}

window.handleGenerate = () => {
  $('btnGenerate')?.click();
};

window.handlePrint = () => {
  const printButton = $('btnPrint') || document.getElementById('export-pdf-button');
  printButton?.click();
};

window.handleEmail = () => {
  const emailButton = $('btnEmail') || $('btnEmailBottom');
  emailButton?.click();
};
