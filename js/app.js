const FORM_STORAGE_KEY = 'tenancy_form_v1';
const SIGNATURE_KEYS = {
  sigSub0: 'sig_sub_0',
  sigTenant: 'sig_tenant',
};

const saveIndicator = document.getElementById('saveIndicator');
let indicatorTimer;
let formSaveTimer;
let storageAvailable = true;

try {
  const probeKey = '__tenancy_probe__';
  window.localStorage.setItem(probeKey, '1');
  window.localStorage.removeItem(probeKey);
} catch (error) {
  storageAvailable = false;
  if (saveIndicator) {
    saveIndicator.textContent = 'Autosave unavailable';
    saveIndicator.setAttribute('data-state', 'error');
  }
}

const showSaving = () => {
  if (!saveIndicator) return;
  window.clearTimeout(indicatorTimer);
  saveIndicator.textContent = 'Saving…';
  saveIndicator.removeAttribute('data-state');
};

const showSaved = () => {
  if (!saveIndicator) return;
  window.clearTimeout(indicatorTimer);
  saveIndicator.textContent = 'Saved';
  saveIndicator.setAttribute('data-state', 'saved');
  indicatorTimer = window.setTimeout(() => {
    saveIndicator.textContent = '\u00A0';
    saveIndicator.removeAttribute('data-state');
  }, 1600);
};

const showSaveError = () => {
  if (!saveIndicator) return;
  window.clearTimeout(indicatorTimer);
  saveIndicator.textContent = 'Save failed';
  saveIndicator.setAttribute('data-state', 'error');
  indicatorTimer = window.setTimeout(() => {
    saveIndicator.textContent = '\u00A0';
    saveIndicator.removeAttribute('data-state');
  }, 2600);
};

const formatDateUK = (value) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', {
    timeZone: 'Europe/London',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateInput = (value) => {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    return iso;
  } catch (error) {
    return '';
  }
};

const isValidEmail = (value = '') => /[^\s@]+@[^\s@]+\.[^\s@]+/.test(value);

const ordinal = (n) => {
  const num = Number(n);
  if (!Number.isFinite(num) || num <= 0) return '';
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
};

const ukTimestamp = () =>
  new Date().toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    hour12: false,
  });

const fieldIds = {
  agreementDate: 'agreementDate',
  startDate: 'startDate',
  rentDueDay: 'rentDueDay',
  subTenantName: 'subTenantName',
  subTenantEmail: 'subTenantEmail',
  subTenantAddress: 'subTenantAddress',
  agreeTerms: 'agreeTerms',
};

const fieldElements = Object.fromEntries(
  Object.entries(fieldIds).map(([key, id]) => [key, document.getElementById(id)])
);

const errorElements = {
  agreementDate: document.getElementById('agreementDateError'),
  startDate: document.getElementById('startDateError'),
  rentDueDay: document.getElementById('rentDueDayError'),
  subTenantName: document.getElementById('subTenantNameError'),
  subTenantEmail: document.getElementById('subTenantEmailError'),
  subTenantAddress: document.getElementById('subTenantAddressError'),
  agreeTerms: document.getElementById('agreeTermsError'),
};

const touchedFields = new Set();
let currentFormData = {};

const collectFormData = () => {
  const agreementDate = fieldElements.agreementDate?.value?.trim() ?? '';
  const startDate = fieldElements.startDate?.value?.trim() ?? '';
  const rentDueDay = fieldElements.rentDueDay?.value?.trim() ?? '';
  const subTenantName = fieldElements.subTenantName?.value?.trim() ?? '';
  const subTenantEmail = fieldElements.subTenantEmail?.value?.trim() ?? '';
  const subTenantAddress = fieldElements.subTenantAddress?.value?.trim() ?? '';
  const agreeTerms = Boolean(fieldElements.agreeTerms?.checked);

  return {
    agreementDate,
    startDate,
    rentDueDay,
    subTenantName,
    subTenantEmail,
    subTenantAddress,
    agreeTerms,
  };
};

const setFieldError = (name, hasError, message, show) => {
  const field = fieldElements[name];
  const errorEl = errorElements[name];
  if (!field || !errorEl) return;
  if (hasError && show) {
    errorEl.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.style.borderColor = `var(--colour-danger)`;
  } else {
    errorEl.textContent = '';
    field.removeAttribute('aria-invalid');
    field.style.borderColor = '';
  }
};

const setAgreeError = (hasError, show) => {
  const errorEl = errorElements.agreeTerms;
  const field = fieldElements.agreeTerms;
  if (!errorEl || !field) return;
  if (hasError && show) {
    errorEl.textContent = 'Please confirm that you agree to the terms.';
    field.setAttribute('aria-invalid', 'true');
  } else {
    errorEl.textContent = '';
    field.removeAttribute('aria-invalid');
  }
};

const validateForm = (showAll = false, data = currentFormData) => {
  const rentDueDayNumber = Number(data.rentDueDay);
  const errors = {
    agreementDate: !data.agreementDate,
    startDate: !data.startDate,
    rentDueDay: !data.rentDueDay || rentDueDayNumber !== 1,
    subTenantName: !data.subTenantName,
    subTenantAddress: !data.subTenantAddress,
    agreeTerms: !data.agreeTerms,
  };

  setFieldError(
    'agreementDate',
    errors.agreementDate,
    'Please provide the agreement date.',
    showAll || touchedFields.has('agreementDate')
  );
  setFieldError(
    'startDate',
    errors.startDate,
    'Please provide the start date.',
    showAll || touchedFields.has('startDate')
  );
  setFieldError(
    'rentDueDay',
    errors.rentDueDay,
    'Rent is fixed to the 1st of each month.',
    showAll || touchedFields.has('rentDueDay')
  );
  setFieldError(
    'subTenantName',
    errors.subTenantName,
    'Enter the sub-tenant’s full name.',
    showAll || touchedFields.has('subTenantName')
  );
  setFieldError(
    'subTenantAddress',
    errors.subTenantAddress,
    'Enter the sub-tenant’s address.',
    showAll || touchedFields.has('subTenantAddress')
  );
  const emailHasValue = Boolean(data.subTenantEmail);
  const emailInvalid = emailHasValue && !isValidEmail(data.subTenantEmail);
  setFieldError(
    'subTenantEmail',
    emailInvalid,
    'Enter a valid email address.',
    showAll || touchedFields.has('subTenantEmail')
  );
  setAgreeError(errors.agreeTerms, showAll || touchedFields.has('agreeTerms'));

  const invalidFieldKey = Object.keys(errors).find((key) => errors[key]);
  const valid = !invalidFieldKey;

  if (!valid && showAll) {
    const focusTarget = fieldElements[invalidFieldKey] || fieldElements.agreeTerms;
    focusTarget?.focus({ preventScroll: false });
  }

  return valid;
};

const tabs = Array.from(document.querySelectorAll('.tab'));
const tabPanels = {
  rules: document.getElementById('tab-rules'),
  agreement: document.getElementById('tab-agreement'),
  sign: document.getElementById('tab-sign'),
};

let activeTab = 'rules';

const showTab = (name) => {
  activeTab = name;
  tabs.forEach((tab) => {
    const tabName = tab.dataset.tab;
    const selected = tabName === name;
    tab.setAttribute('aria-selected', String(selected));
  });

  Object.entries(tabPanels).forEach(([key, panel]) => {
    if (!panel) return;
    if (key === name) {
      panel.hidden = false;
    } else {
      panel.hidden = true;
    }
  });

  if (name === 'sign') {
    tabPanels.sign?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const updateSignTabAvailability = (data = currentFormData) => {
  const signTab = tabs.find((tab) => tab.dataset.tab === 'sign');
  if (!signTab) return;
  const basicValid =
    data.agreementDate &&
    data.startDate &&
    data.subTenantName &&
    data.subTenantAddress &&
    data.rentDueDay &&
    Number(data.rentDueDay) === 1 &&
    data.agreeTerms;
  signTab.disabled = !basicValid;
  signTab.setAttribute('aria-disabled', String(!basicValid));
  if (!basicValid && activeTab === 'sign') {
    showTab('agreement');
  }
};

const getStoredFormData = () => {
  if (!storageAvailable) return null;
  try {
    const raw = window.localStorage.getItem(FORM_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
};

const saveFormData = () => {
  if (!storageAvailable) return;
  showSaving();
  window.clearTimeout(formSaveTimer);
  formSaveTimer = window.setTimeout(() => {
    try {
      const dataToStore = { ...currentFormData };
      window.localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToStore));
      showSaved();
    } catch (error) {
      showSaveError();
    }
  }, 400);
};

const applyStoredForm = () => {
  const todayIso = new Date();
  const defaultAgreement = new Date(
    todayIso.getTime() - todayIso.getTimezoneOffset() * 60000
  )
    .toISOString()
    .slice(0, 10);

  if (fieldElements.agreementDate && !fieldElements.agreementDate.value) {
    fieldElements.agreementDate.value = defaultAgreement;
  }
  if (fieldElements.startDate && !fieldElements.startDate.value) {
    fieldElements.startDate.value = '2025-11-29';
  }
  if (fieldElements.rentDueDay && !fieldElements.rentDueDay.value) {
    fieldElements.rentDueDay.value = '1';
  }

  const stored = getStoredFormData();
  if (!stored) return;
  if (fieldElements.agreementDate && stored.agreementDate) {
    fieldElements.agreementDate.value = formatDateInput(stored.agreementDate) || stored.agreementDate;
  }
  if (fieldElements.startDate && stored.startDate) {
    fieldElements.startDate.value = formatDateInput(stored.startDate) || stored.startDate;
  }
  if (fieldElements.rentDueDay) {
    fieldElements.rentDueDay.value = '1';
  }
  if (fieldElements.subTenantName && stored.subTenantName) {
    fieldElements.subTenantName.value = stored.subTenantName;
  }
  if (fieldElements.subTenantEmail && stored.subTenantEmail) {
    fieldElements.subTenantEmail.value = stored.subTenantEmail;
  }
  if (fieldElements.subTenantAddress && stored.subTenantAddress) {
    fieldElements.subTenantAddress.value = stored.subTenantAddress;
  }
  if (fieldElements.agreeTerms) {
    fieldElements.agreeTerms.checked = Boolean(stored.agreeTerms);
  }
};

const signatureStates = {};

const DAVID_SIGNATURE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140">
      <style>
        text { font-family: "Brush Script MT", "Segoe Script", cursive; font-size: 48px; fill: #0b3d91; }
        path { stroke: #0b3d91; stroke-width: 3; fill: none; }
      </style>
      <text x="16" y="86">David Martin</text>
      <path d="M18 98 C 80 120, 140 120, 210 102" />
    </svg>`
)}
`;

const DAVID_SIGNATURE_TIMESTAMP = 'Signed on 26 November 2025 (UK time)';

signatureStates.sigTenant = {
  image: DAVID_SIGNATURE_IMAGE,
  timestamp: DAVID_SIGNATURE_TIMESTAMP,
};

const drawImageToCanvas = (canvas, context, dataUrl, ratio) => {
  if (!dataUrl) {
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    context.clearRect(0, 0, width, height);
    return;
  }
  const image = new Image();
  image.onload = () => {
    const width = canvas.width / ratio;
    const height = canvas.height / ratio;
    context.clearRect(0, 0, width, height);
    const aspect = image.width / image.height;
    let drawWidth = width;
    let drawHeight = drawWidth / aspect;
    if (drawHeight > height) {
      drawHeight = height;
      drawWidth = drawHeight * aspect;
    }
    const offsetX = (width - drawWidth) / 2;
    const offsetY = (height - drawHeight) / 2;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  };
  image.src = dataUrl;
};

const persistSignature = (state) => {
  if (!storageAvailable) return;
  showSaving();
  try {
    if (!state.image && !state.timestamp) {
      window.localStorage.removeItem(state.storageKey);
    } else {
      window.localStorage.setItem(
        state.storageKey,
        JSON.stringify({ image: state.image, timestamp: state.timestamp })
      );
    }
    showSaved();
  } catch (error) {
    showSaveError();
  }
};

const updateSignaturePreview = () => {
  const bindings = {
    sigSub0Stamp: signatureStates.sigSub0?.timestamp || '[Signature and UK timestamp]',
    sigTenantStamp: signatureStates.sigTenant?.timestamp || '[Signature and UK timestamp]',
  };
  document.querySelectorAll('[data-bind]').forEach((node) => {
    const key = node.dataset.bind;
    if (bindings[key]) {
      node.textContent = bindings[key];
    }
  });

  Object.entries(signatureStates).forEach(([id, state]) => {
    const img = document.querySelector(`[data-sig-img="${id}"]`);
    if (!img) return;
    if (state.image) {
      img.src = state.image;
      img.dataset.hasImage = 'true';
    } else {
      img.removeAttribute('src');
      img.dataset.hasImage = 'false';
    }
  });

  updateExportState();
};

const configureTimestamp = (state) => {
  const timeEl = document.getElementById(`${state.id}Time`);
  if (!timeEl) return;
  const text = state.timestamp ? `Stamped ${state.timestamp}` : 'No timestamp yet';
  timeEl.textContent = text;
};

const clearSignatureState = (state) => {
  if (!state?.canvas || !state?.context) return;
  const ratio = state.ratio || 1;
  const width = state.canvas.width / ratio;
  const height = state.canvas.height / ratio;
  state.context.clearRect(0, 0, width, height);
  state.image = null;
  state.timestamp = null;
  configureTimestamp(state);
  if (storageAvailable && state.storageKey) {
    window.localStorage.removeItem(state.storageKey);
  }
};

const initSignaturePad = (id) => {
  const canvas = document.getElementById(id);
  if (!canvas) return;
  const storageKey = SIGNATURE_KEYS[id];
  const context = canvas.getContext('2d');
  const state = {
    id,
    canvas,
    context,
    storageKey,
    image: null,
    timestamp: null,
    drawing: false,
    hasStroke: false,
    lastX: 0,
    lastY: 0,
    ratio: Math.max(window.devicePixelRatio || 1, 1),
  };

  canvas.style.touchAction = 'none';

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const previousImage = state.image;
    state.ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = Math.floor(rect.width * state.ratio);
    canvas.height = Math.floor(180 * state.ratio);
    context.setTransform(state.ratio, 0, 0, state.ratio, 0, 0);
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#111';
    context.clearRect(0, 0, rect.width, 180);
    if (previousImage) {
      drawImageToCanvas(canvas, context, previousImage, state.ratio);
    }
  };

  const pointerPosition = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const commit = () => {
    if (!state.hasStroke) return;
    state.image = canvas.toDataURL('image/png');
    state.timestamp = null;
    configureTimestamp(state);
    persistSignature(state);
    updateSignaturePreview();
  };

  canvas.addEventListener('pointerdown', (event) => {
    canvas.setPointerCapture(event.pointerId);
    state.drawing = true;
    state.hasStroke = false;
    const point = pointerPosition(event);
    state.lastX = point.x;
    state.lastY = point.y;
    event.preventDefault();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!state.drawing) return;
    const point = pointerPosition(event);
    context.beginPath();
    context.moveTo(state.lastX, state.lastY);
    context.lineTo(point.x, point.y);
    context.stroke();
    state.lastX = point.x;
    state.lastY = point.y;
    state.hasStroke = true;
    event.preventDefault();
  });

  const stopDrawing = (event) => {
    if (!state.drawing) return;
    state.drawing = false;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      // ignore
    }
    commit();
  };

  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointerleave', stopDrawing);

  const clear = () => {
    const width = canvas.width / state.ratio;
    const height = canvas.height / state.ratio;
    context.clearRect(0, 0, width, height);
    state.image = null;
    state.timestamp = null;
    configureTimestamp(state);
    persistSignature(state);
    updateSignaturePreview();
  };

  const stampButton = document.querySelector(`[data-action="stamp"][data-target="${id}"]`);
  stampButton?.addEventListener('click', () => {
    if (!state.image) {
      const timeEl = document.getElementById(`${id}Time`);
      if (timeEl) {
        timeEl.textContent = 'Add a signature before stamping the time.';
      }
      return;
    }
    state.timestamp = ukTimestamp();
    configureTimestamp(state);
    persistSignature(state);
    updateSignaturePreview();
  });

  const clearButton = document.querySelector(`[data-action="clear"][data-target="${id}"]`);
  clearButton?.addEventListener('click', clear);

  const uploadInput = document.querySelector(`input[data-target="${id}"]`);
  uploadInput?.addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      state.image = result;
      state.timestamp = null;
      drawImageToCanvas(canvas, context, result, state.ratio);
      configureTimestamp(state);
      persistSignature(state);
      updateSignaturePreview();
    };
    reader.readAsDataURL(file);
  });

  const saved = storageAvailable
    ? window.localStorage.getItem(state.storageKey)
    : null;
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.image) {
        state.image = parsed.image;
        drawImageToCanvas(canvas, context, parsed.image, state.ratio);
      }
      if (parsed.timestamp) {
        state.timestamp = parsed.timestamp;
      }
      configureTimestamp(state);
    } catch (error) {
      // ignore malformed stored data
    }
  } else {
    configureTimestamp(state);
  }

  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(() => resize());
    observer.observe(canvas);
  }
  window.addEventListener('resize', resize);
  resize();

  signatureStates[id] = state;
};

['sigSub0'].forEach(initSignaturePad);

const resetSignatures = () => {
  Object.values(signatureStates).forEach((state) => clearSignatureState(state));
  updateSignaturePreview();
};

const exportButton = document.getElementById('exportPdf');
const previewContainer = document.getElementById('preview');

const updatePreview = (data = currentFormData) => {
  const bindings = {
    agreementDate: data.agreementDate ? formatDateUK(data.agreementDate) : '[Date]',
    startDate: data.startDate ? formatDateUK(data.startDate) : '[Start Date]',
    rentDueDayOrdinal: data.rentDueDay ? ordinal(data.rentDueDay) : '[Due Day]',
    subTenantName: data.subTenantName || '[Sub-Tenant full name]',
    subTenantAddress: data.subTenantAddress || '[Sub-Tenant address]',
    sigSub0Stamp: signatureStates.sigSub0?.timestamp || '[Signature and UK timestamp]',
    sigTenantStamp: signatureStates.sigTenant?.timestamp || '[Signature and UK timestamp]',
  };

  document.querySelectorAll('[data-bind]').forEach((node) => {
    const key = node.dataset.bind;
    if (Object.prototype.hasOwnProperty.call(bindings, key)) {
      node.textContent = bindings[key];
    }
  });

  Object.entries(signatureStates).forEach(([id, state]) => {
    const img = document.querySelector(`[data-sig-img="${id}"]`);
    if (!img) return;
    if (state.image) {
      img.src = state.image;
      img.dataset.hasImage = 'true';
    } else {
      img.removeAttribute('src');
      img.dataset.hasImage = 'false';
    }
  });
};

const updateExportState = (data = currentFormData, formValid) => {
  if (!exportButton) return;
  const isFormValid = typeof formValid === 'boolean' ? formValid : validateForm(false, data);
  const subSignaturePresent = Boolean(signatureStates.sigSub0?.image);
  const canExport = isFormValid && subSignaturePresent;
  exportButton.disabled = !canExport;
};

const refreshState = () => {
  currentFormData = collectFormData();
  const formValid = validateForm(false, currentFormData);
  updatePreview(currentFormData);
  updateSignTabAvailability(currentFormData);
  updateExportState(currentFormData, formValid);
};

applyStoredForm();
refreshState();

const resetFormFields = () => {
  Object.values(fieldElements).forEach((field) => {
    if (!field) return;
    field.removeAttribute('aria-invalid');
    field.style.borderColor = '';
    if (field.type === 'checkbox') {
      field.checked = false;
    } else {
      field.value = '';
    }
  });
};

const clearFieldErrors = () => {
  Object.values(errorElements).forEach((error) => {
    if (error) {
      error.textContent = '';
    }
  });
};

const clearFormAndStorage = () => {
  window.clearTimeout(formSaveTimer);
  window.clearTimeout(indicatorTimer);

  resetFormFields();
  clearFieldErrors();
  touchedFields.clear();
  currentFormData = {};

  if (saveIndicator) {
    saveIndicator.textContent = '\u00A0';
    saveIndicator.removeAttribute('data-state');
  }

  if (storageAvailable) {
    window.localStorage.removeItem(FORM_STORAGE_KEY);
    Object.values(SIGNATURE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
  }

  resetSignatures();
  applyStoredForm();
  refreshState();
};

const markTouched = (fieldName) => {
  touchedFields.add(fieldName);
};

Object.entries(fieldElements).forEach(([name, element]) => {
  if (!element) return;
  const handler = () => {
    markTouched(name);
    refreshState();
    saveFormData();
  };
  if (element.type === 'checkbox') {
    element.addEventListener('change', handler);
  } else {
    element.addEventListener('input', handler);
    element.addEventListener('blur', () => {
      markTouched(name);
      refreshState();
    });
  }
});

const ensureFormValidityForActions = () => {
  refreshState();
  const valid = validateForm(true, currentFormData);
  updateExportState(currentFormData, valid);
  if (!valid) {
    showTab('agreement');
  }
  return valid;
};

const goToSign = () => {
  const valid = ensureFormValidityForActions();
  if (!valid) return;
  updateSignTabAvailability(currentFormData);
  if (!tabs.find((tab) => tab.dataset.tab === 'sign')?.disabled) {
    showTab('sign');
  }
};

const toSignButton = document.getElementById('toSignButton');
toSignButton?.addEventListener('click', goToSign);

const backToDetailsButton = document.getElementById('backToDetails');
backToDetailsButton?.addEventListener('click', () => {
  showTab('agreement');
});

const clearFormButton = document.getElementById('clearFormButton');
clearFormButton?.addEventListener('click', () => {
  const confirmed = window.confirm(
    'Clear all entered details, saved signatures, and stored progress?'
  );
  if (!confirmed) return;
  clearFormAndStorage();
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const name = tab.dataset.tab;
    if (name === 'sign') {
      if (!ensureFormValidityForActions()) return;
      updateSignTabAvailability(currentFormData);
      if (tab.disabled) return;
    }
    showTab(name);
  });
});

const emailAgreementButton = document.getElementById('sendAgreementEmail');

const buildAgreementEmailBody = () => {
  const subTenantName = fieldElements.subTenantName?.value?.trim() || '[Sub-Tenant Name]';
  const subTenantEmail = fieldElements.subTenantEmail?.value?.trim() || '';
  const subTenantPhone = document.getElementById('subTenantPhone')?.value?.trim() || '';
  const agreementDateValue = fieldElements.agreementDate?.value || '';
  const moveInDateValue = fieldElements.startDate?.value || '';
  const rentAmount = '£750';
  const rentDueDay = currentFormData.rentDueDay
    ? `${ordinal(currentFormData.rentDueDay)} of each month`
    : '1st of each month';

  const agreementHtml = previewContainer?.outerHTML || '';

  const agreementDatePretty = formatDateUK(agreementDateValue) || '[Agreement Date]';
  const moveInDatePretty = formatDateUK(moveInDateValue) || '[Move-In Date]';

  return `
  <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111827;">
    <p>Hello David,</p>

    <p>
      The Sub-Tenancy Agreement has now been completed for <strong>${subTenantName}</strong>. 
      Please find the full details below for your records.
    </p>

    <p>
      <strong>Property:</strong> Flat 1, 61 Caledonian Crescent, Edinburgh<br/>
      <strong>Agreement Date:</strong> ${agreementDatePretty}<br/>
      <strong>Start Date:</strong> ${moveInDatePretty}<br/>
      <strong>Monthly Rent:</strong> ${rentAmount}<br/>
      <strong>Rent Due Day:</strong> ${rentDueDay}
    </p>

    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />

    <h3 style="margin: 0 0 10px; font-size: 1.1rem;">Agreement Summary</h3>

    <p>
      This Sub-Tenancy Agreement (“the Agreement”) is made on <strong>${agreementDatePretty}</strong> between:
    </p>

    <ol style="padding-left: 20px;">
      <li>
        <strong>David Martin</strong> (“the Tenant” or “lead tenant”), the primary tenant and current occupier who 
        rents the property from the landlord through Milard’s Property Management, and who has written permission 
        to sub-let one room within the property; and
      </li>
      <li>
        <strong>${subTenantName}</strong> (“the Sub-Tenant”).
      </li>
    </ol>

    <h4 style="margin: 16px 0 6px; font-size: 1rem;">Initial Payments (No Deposit)</h4>
    <p>
      The Sub-Tenant agrees to an initial total of <strong>£1500</strong>, paid as two instalments:
    </p>
    <ul style="padding-left: 18px; margin-top: 4px;">
      <li><strong>${rentAmount}</strong> on the move-in date (<strong>${moveInDatePretty}</strong>); and</li>
      <li><strong>${rentAmount}</strong> scheduled for the next rent due day (1st of the following month).</li>
    </ul>
    <p>
      No separate tenancy deposit is required. The final month’s rent is covered by the second instalment.
    </p>
    <p>
      Rent is charged per full calendar month and is not refunded pro-rata. If the Sub-Tenant leaves part-way through a 
      paid month, or leaves before the required notice period has elapsed, the rent for that month remains due in full.
    </p>
    <p>
      After the tenancy ends, reasonable charges may be made for damage beyond fair wear and tear, professional cleaning 
      if needed, or unpaid utilities. Any deductions will be supported by receipts or reasonable evidence, and any 
      remaining balance will be returned to the Sub-Tenant.
    </p>

    <h4 style="margin: 16px 0 6px; font-size: 1rem;">Ending the Agreement</h4>
    <p>
      Either party may end this Agreement by giving a minimum of <strong>28 days’ written notice</strong>. 
      Four to six weeks’ notice is preferred where possible.
    </p>
    <p>
      The Sub-Tenant must return all keys/fobs and leave both the room and shared areas clean, tidy and undamaged, 
      allowing for fair wear and tear. Rent remains payable in full months only. Where a departure occurs mid-month, 
      no pro-rata refund is due.
    </p>

    <h4 style="margin: 16px 0 6px; font-size: 1rem;">General Provisions</h4>
    <p>
      This Agreement sets out the full understanding between both parties and replaces any previous discussions or 
      informal arrangements. Any amendments must be made in writing and agreed by both the lead tenant and the Sub-Tenant.
    </p>
    <p>
      This Agreement is governed by the laws of Scotland. Both parties will attempt to resolve any disputes amicably 
      before taking further action.
    </p>
    <p>
      The landlord and managing agent are not parties to this Agreement. All day-to-day issues, communications and 
      arrangements are between David Martin and the Sub-Tenant, except where legal obligations require the landlord 
      or agent to be informed.
    </p>

    <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />

    <h4 style="margin: 0 0 8px; font-size: 1rem;">Digital Signing Statement</h4>
    <p>
      By sending this email, I confirm that:
    </p>
    <ul style="padding-left: 18px; margin-top: 4px;">
      <li>I have reviewed the Sub-Tenancy Agreement in full;</li>
      <li>All details provided are accurate to the best of my knowledge; and</li>
      <li><strong>I agree to the terms and conditions set out in the Agreement.</strong></li>
    </ul>
    <p>
      <strong>Digital signature captured in attached PDF.</strong>
    </p>

    <p style="margin-top: 18px;">
      The full Agreement is included below in HTML format for reference:
    </p>

    <div style="margin-top: 12px; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb; background: #f9fafb;">
      ${agreementHtml}
    </div>

    <p style="margin-top: 20px;">
      Thank you,<br/>
      <strong>${subTenantName}</strong><br/>
      ${subTenantEmail ? `${subTenantEmail}<br/>` : ''}
      ${subTenantPhone || ''}
    </p>
  </div>
  `;
};

emailAgreementButton?.addEventListener('click', async () => {
  const formValid = ensureFormValidityForActions();
  const emailAddress = currentFormData.subTenantEmail;
  const emailValid = Boolean(emailAddress) && isValidEmail(emailAddress);
  touchedFields.add('subTenantEmail');
  setFieldError(
    'subTenantEmail',
    !emailValid,
    'Enter a valid email address to send the agreement.',
    true
  );
  if (!formValid || !emailValid) {
    fieldElements.subTenantEmail?.focus();
    return;
  }

  const agreementPreview = previewContainer?.innerHTML || '';
  if (!agreementPreview.trim()) {
    alert('Please generate the agreement preview before emailing.');
    return;
  }

  const emailBodyHtml = buildAgreementEmailBody();
  if (!emailBodyHtml) {
    alert('Please generate the agreement preview before emailing.');
    return;
  }

  const subject = 'Completed Sub-Tenancy Agreement for Flat 1, 61 Caledonian Crescent';

  emailAgreementButton.disabled = true;
  emailAgreementButton.setAttribute('aria-busy', 'true');

  try {
    const response = await fetch('/api/send-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: emailAddress, subject, html: emailBodyHtml }),
    });

    if (!response.ok) {
      throw new Error('Unable to send email');
    }

    alert('Agreement emailed successfully.');
  } catch (error) {
    alert('Unable to send the agreement by email. Please try again.');
  } finally {
    emailAgreementButton.disabled = false;
    emailAgreementButton.removeAttribute('aria-busy');
  }
});

const emailButton = document.getElementById('emailDavid');
emailButton?.addEventListener('click', () => {
  const formValid = ensureFormValidityForActions();
  if (!formValid) return;
  const names = currentFormData.subTenantName || 'New sub-tenant';
  const subject = encodeURIComponent(`Sub-Tenancy Agreement — ${names}`);
  const agreementDate = currentFormData.agreementDate
    ? formatDateUK(currentFormData.agreementDate)
    : '[date]';
  const start = currentFormData.startDate
    ? formatDateUK(currentFormData.startDate)
    : '[start date]';
  const due = currentFormData.rentDueDay
    ? ordinal(currentFormData.rentDueDay)
    : '[Due Day]';

  const partiesSection = `This Sub-Tenancy Agreement (“the Agreement”) is made on ${agreementDate} between:\n1. David Martin (“the Tenant” or “lead tenant”), the primary tenant and current occupier who rents the property from the landlord through Milard’s Property Management and has written permission to sub-let one room in the property; and\n2. ${names} (“the Sub-Tenant”).`;

  const initialPaymentsSection = `Initial Payments (no deposit):\n- The Sub-Tenant agrees to an initial total of £1500, paid in two instalments: £750 on the move-in date (${start}) and £750 scheduled for the 1st of the following month. There is no separate tenancy deposit. The last month’s rent is applied to the final month of the tenancy.\n- Rent is charged by whole calendar month and is not refunded pro-rata. If the Sub-Tenant chooses to leave part-way through a paid month, or leave before the end of the required 28 days’ notice period, the rent already paid for that month will remain payable in full.\n- After departure at the end of the tenancy, reasonable charges for any damage beyond fair wear and tear, professional cleaning if required, or unpaid utilities may be recovered from rent paid in advance. Receipts or reasonable evidence will be provided for any such deductions, and any remaining balance will be returned to the Sub-Tenant.`;

  const endingSection = `Ending the Agreement:\n- Either party may end this Agreement by giving at least 28 days written notice. Four to six weeks’ notice is preferred where possible.\n- On leaving, return all keys/fobs and leave the room and shared areas clean and undamaged, allowing for fair wear and tear.\n- Rent is payable by full calendar month. Where the Sub-Tenant chooses to leave during a month that has already been paid for, no pro-rata refund of that month’s rent will be due.`;

  const generalSection = `General:\n- This Agreement constitutes the entire understanding between the parties and supersedes prior agreements. Any amendments must be in writing and signed by both parties. This Agreement is governed by the laws of Scotland. The parties will attempt to resolve disputes amicably before formal action.\n- The landlord and managing agent are not parties to this Sub-Tenancy Agreement. Day-to-day issues and communications under this Agreement are between the lead tenant and the Sub-Tenant, except where the law requires the landlord or managing agent to become involved.`;

  const body = encodeURIComponent(
    `Hello David,

The sub-tenancy agreement is completed for ${names}.

Property: Flat 1, 61 Caledonian Crescent, Edinburgh
Agreement date: ${agreementDate}
Start Date: ${start}
Monthly Rent: £750
Rent Due Day: ${due}

${partiesSection}

${initialPaymentsSection}

${endingSection}

${generalSection}

I’ve attached the PDF (or will send it next).

Thank you,
${currentFormData.subTenantName || 'Sub-tenant'}`
  );
  window.location.href = `mailto:david.martin.1296@gmail.com?subject=${subject}&body=${body}`;
});

const exportPdfButton = exportButton;
exportPdfButton?.addEventListener('click', () => {
  const formValid = ensureFormValidityForActions();
  if (!formValid || exportPdfButton.disabled) return;
  window.print();
});

const toAgreementTab = tabs.find((tab) => tab.dataset.tab === 'agreement');
toAgreementTab?.addEventListener('click', () => {
  refreshState();
});

const rulesTab = tabs.find((tab) => tab.dataset.tab === 'rules');
rulesTab?.addEventListener('click', () => {
  showTab('rules');
});

const startOnAgreement = () => {
  if (currentFormData.subTenantName || currentFormData.subTenantAddress) {
    showTab('agreement');
  }
};

startOnAgreement();
