import { db, collection, addDoc, serverTimestamp } from "./firebase-init.js";

const PROPERTY_ADDRESS = "Flat 1, 61 Caledonian Crescent, Edinburgh";

const getInputValue = (id) => {
  const el = document.getElementById(id);
  if (!el) return "";
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
    return el.value ?? "";
  }
  return (el.textContent || "").trim();
};

const getCheckboxValue = (id) => {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLInputElement) || el.type !== "checkbox") return false;
  return el.checked;
};

const getCanvasData = (id) => {
  const canvas = document.getElementById(id);
  if (!(canvas instanceof HTMLCanvasElement)) return null;
  try {
    if (!canvas.width || !canvas.height) return null;
    const blank = document.createElement("canvas");
    blank.width = canvas.width;
    blank.height = canvas.height;
    const dataUrl = canvas.toDataURL("image/png");
    if (blank.toDataURL("image/png") === dataUrl) {
      return null;
    }
    return dataUrl;
  } catch (error) {
    console.error("Unable to serialise canvas", error);
    return null;
  }
};

const collectSubTenants = () => {
  const subNameFields = Array.from(document.querySelectorAll('[id^="subName_"]'));
  return subNameFields.map((input) => {
    if (!(input instanceof HTMLInputElement)) return null;
    const [, index] = input.id.split("_");
    const addr = document.getElementById(`subAddr_${index}`);
    const timestampEl = document.getElementById(`stampSub${index}`);
    return {
      index: Number(index),
      name: input.value.trim(),
      address: addr instanceof HTMLTextAreaElement ? addr.value.trim() : "",
      signature: getCanvasData(`sigSub_${index}`),
      timestamp: timestampEl ? timestampEl.textContent?.trim() || "" : "",
    };
  }).filter(Boolean);
};

const buildPayload = () => {
  const rentRaw = getInputValue("rent");
  const rent = rentRaw ? Number(rentRaw) : null;
  const rentDueDay = getInputValue("rentDay");
  const deposit = typeof rent === "number" && Number.isFinite(rent) ? Math.max(rent * 2, 0) : null;

  return {
    tenantName: getInputValue("tenantName"),
    tenantEmail: getInputValue("tenantEmail"),
    tenantPhone: getInputValue("tenantPhone"),
    managingAgent: getInputValue("agent"),
    address: PROPERTY_ADDRESS,
    agreementDate: getInputValue("agreeDate"),
    moveIn: getInputValue("startDate"),
    moveOut: getInputValue("moveOut"),
    rent,
    rentDueDay,
    deposit,
    witnessName: getInputValue("witName"),
    agreedTerms: getCheckboxValue("agreeCheck"),
    signedByTenant: getCanvasData("sigTenant"),
    tenantSignatureTimestamp: getInputValue("stampTenant"),
    witnessSignature: getCanvasData("sigWitness"),
    witnessSignatureTimestamp: getInputValue("stampWit"),
    subTenants: collectSubTenants(),
    timestamp: serverTimestamp(),
  };
};

const indicateStatus = (message, state) => {
  const indicator = document.getElementById("saveIndicator");
  if (!indicator) return;
  indicator.textContent = message;
  if (state) {
    indicator.setAttribute("data-state", state);
  }
  window.setTimeout(() => {
    if (indicator.textContent === message) {
      indicator.textContent = "";
      if (state) indicator.removeAttribute("data-state");
    }
  }, 1800);
};

let isSaving = false;

const persistAgreement = async () => {
  if (isSaving) return false;
  isSaving = true;
  try {
    const payload = buildPayload();
    await addDoc(collection(db, "agreements"), payload);
    indicateStatus("Cloud saved", "saved");
    return true;
  } catch (error) {
    console.error("Error saving agreement:", error);
    indicateStatus("Cloud save failed", "error");
    throw error;
  } finally {
    isSaving = false;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("agreementForm");
  if (!(form instanceof HTMLFormElement)) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const saved = await persistAgreement();
      if (saved) {
        alert("Agreement submitted and saved.");
      }
    } catch (error) {
      alert("Something went wrong saving the form.");
    }
  });
});
