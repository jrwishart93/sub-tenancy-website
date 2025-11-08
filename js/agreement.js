document.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'property61_tenancy_v1';
  // Form elements
  const agreementDateEl = document.getElementById('agreement-date');
  const startDateEl = document.getElementById('start-date');
  const rentEl = document.getElementById('rent');
  const dueDayEl = document.getElementById('due-day');
  const tenant1NameEl = document.getElementById('tenant1-name');
  const tenant1AddressEl = document.getElementById('tenant1-address');
  const tenant2Section = document.getElementById('tenant2-section');
  const tenant2NameEl = document.getElementById('tenant2-name');
  const tenant2AddressEl = document.getElementById('tenant2-address');
  const witnessEl = document.getElementById('witness-name');
  const addTenantBtn = document.getElementById('add-tenant');
  const removeTenantBtn = document.getElementById('remove-tenant');
  const generateBtn = document.getElementById('generate');
  const printBtn = document.getElementById('export-pdf');
  const emailBtn = document.getElementById('email-david');
  const clearBtn = document.getElementById('clear-form');
  const resetSignaturesBtn = document.getElementById('reset-signatures');
  const previewEl = document.getElementById('preview');

  // Initialize signature pads
  const sig1 = initSignaturePad(document.getElementById('sig-tenant1'), { onChange: saveToStorage });
  const sig2 = initSignaturePad(document.getElementById('sig-tenant2'), { onChange: saveToStorage });
  const sigLead = initSignaturePad(document.getElementById('sig-lead'), { onChange: saveToStorage });
  const sigWitness = initSignaturePad(document.getElementById('sig-witness'), { onChange: saveToStorage });

  // Set default dates
  const today = new Date();
  function formatDate(d) {
    return d.toISOString().split('T')[0];
  }
  agreementDateEl.value = formatDate(today);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  startDateEl.value = formatDate(nextWeek);

  // Add/Remove co-sub-tenant
  addTenantBtn.addEventListener('click', () => {
    tenant2Section.style.display = '';
    saveToStorage();
  });
  removeTenantBtn.addEventListener('click', () => {
    tenant2Section.style.display = 'none';
    tenant2NameEl.value = '';
    tenant2AddressEl.value = '';
    sig2.clear();
    saveToStorage();
  });

  function validate() {
    const errors = {};
    if (!agreementDateEl.value) errors.agreementDate = 'Required';
    if (!startDateEl.value) errors.startDate = 'Required';
    const rentVal = parseFloat(rentEl.value);
    if (!(rentVal >= 1)) errors.rent = 'Enter valid rent';
    const due = parseInt(dueDayEl.value, 10);
    if (!(due >= 1 && due <= 28)) errors.dueDay = 'Due day must be 1-28';
    if (!tenant1NameEl.value.trim()) errors.tenant1Name = 'Required';
    if (!tenant1AddressEl.value.trim()) errors.tenant1Address = 'Required';
    return errors;
  }

  function updatePreview() {
    document.getElementById('prev-agreement-date').textContent = agreementDateEl.value;
    document.getElementById('prev-start-date').textContent = startDateEl.value;
    document.getElementById('prev-rent').textContent = rentEl.value;
    document.getElementById('prev-due-day').textContent = dueDayEl.value;
    document.getElementById('prev-tenant1-name').textContent = tenant1NameEl.value;
    document.getElementById('prev-tenant1-address').textContent = tenant1AddressEl.value;
    // tenant2 preview
    if (tenant2Section.style.display !== 'none' && tenant2NameEl.value) {
      document.getElementById('prev-tenant2').style.display = '';
      document.getElementById('prev-tenant2-name').textContent = tenant2NameEl.value;
      document.getElementById('prev-tenant2-address').textContent = tenant2AddressEl.value;
    } else {
      document.getElementById('prev-tenant2').style.display = 'none';
    }
    document.getElementById('prev-witness-name').textContent = witnessEl.value;
    // signatures
    document.getElementById('prev-sig-tenant1').src = sig1.toDataURL();
    document.getElementById('prev-sig-tenant2').src = sig2.toDataURL();
    document.getElementById('prev-sig-lead').src = sigLead.toDataURL();
    document.getElementById('prev-sig-witness').src = sigWitness.toDataURL();
  }

  function saveToStorage() {
    const data = {
      agreementDate: agreementDateEl.value,
      startDate: startDateEl.value,
      rent: rentEl.value,
      dueDay: dueDayEl.value,
      tenant1: { name: tenant1NameEl.value, address: tenant1AddressEl.value },
      tenant2Visible: tenant2Section.style.display !== 'none',
      tenant2: { name: tenant2NameEl.value, address: tenant2AddressEl.value },
      witness: witnessEl.value,
      sig1: sig1.toDataURL(),
      sig2: sig2.toDataURL(),
      sigLead: sigLead.toDataURL(),
      sigWitness: sigWitness.toDataURL()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      agreementDateEl.value = data.agreementDate || agreementDateEl.value;
      startDateEl.value = data.startDate || startDateEl.value;
      rentEl.value = data.rent || rentEl.value;
      dueDayEl.value = data.dueDay || dueDayEl.value;
      if (data.tenant1) {
        tenant1NameEl.value = data.tenant1.name || '';
        tenant1AddressEl.value = data.tenant1.address || '';
      }
      if (data.tenant2Visible) {
        tenant2Section.style.display = '';
        tenant2NameEl.value = data.tenant2?.name || '';
        tenant2AddressEl.value = data.tenant2?.address || '';
      } else {
        tenant2Section.style.display = 'none';
      }
      witnessEl.value = data.witness || '';
      if (data.sig1) sig1.setImage(data.sig1);
      if (data.sig2) sig2.setImage(data.sig2);
      if (data.sigLead) sigLead.setImage(data.sigLead);
      if (data.sigWitness) sigWitness.setImage(data.sigWitness);
    } catch (e) {}
  }

  [agreementDateEl, startDateEl, rentEl, dueDayEl, tenant1NameEl, tenant1AddressEl, tenant2NameEl, tenant2AddressEl, witnessEl].forEach(el => {
    el.addEventListener('input', saveToStorage);
  });

  generateBtn.addEventListener('click', () => {
    const errors = validate();
    if (Object.keys(errors).length) {
      alert('Please fill all required fields correctly');
      return;
    }
    updatePreview();
    saveToStorage();
    previewEl.scrollIntoView({ behavior: 'smooth' });
  });

  printBtn.addEventListener('click', () => {
    updatePreview();
    window.print();
  });

  emailBtn.addEventListener('click', () => {
    const names = [tenant1NameEl.value];
    if (tenant2Section.style.display !== 'none' && tenant2NameEl.value) names.push(tenant2NameEl.value);
    const subject = 'Sub-Tenancy Agreement — ' + names.join(' & ');
    let body = '';
    body += 'Agreement Date: ' + agreementDateEl.value + '\n';
    body += 'Start Date: ' + startDateEl.value + '\n';
    body += 'Rent: £' + rentEl.value + '\n';
    body += 'Due Day: ' + dueDayEl.value + '\n';
    const mailto = 'mailto:david.martin.1296@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    window.location.href = mailto;
  });

  clearBtn.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
  });

  resetSignaturesBtn.addEventListener('click', () => {
    sig1.clear();
    sig2.clear();
    sigLead.clear();
    sigWitness.clear();
    saveToStorage();
  });

  loadFromStorage();
});
