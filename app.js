/**
 * LockFit — lock-screen wallpaper safe-zone preview
 * Free: 1–2 presets + watermark. Unlock via license key only.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lockfit_license_v1";
  const SOURCE_KEY = "lockfit_unlock_src_v1";
  const FREE_DEVICE_IDS = ["iphone-15-pro", "pixel-8"];

  /** Approximate device presets (CSS px for preview; logical sizes for export). */
  const DEVICES = [
    {
      id: "iphone-15-pro",
      name: "iPhone 15 Pro",
      free: true,
      w: 393,
      h: 852,
      scale: 0.72,
      radius: 48,
      overlay: "dynamic-island",
      island: { cx: 0.5, cy: 0.042, w: 0.32, h: 0.042 },
      clock: { x: 0.08, y: 0.12, w: 0.84, h: 0.14 },
      safe: { x: 0.06, y: 0.28, w: 0.88, h: 0.42 }
    },
    {
      id: "iphone-14",
      name: "iPhone 14 / 13",
      free: false,
      w: 390,
      h: 844,
      scale: 0.72,
      radius: 44,
      overlay: "notch",
      notch: { cx: 0.5, cy: 0, w: 0.42, h: 0.055 },
      clock: { x: 0.08, y: 0.11, w: 0.84, h: 0.14 },
      safe: { x: 0.06, y: 0.28, w: 0.88, h: 0.42 }
    },
    {
      id: "iphone-se",
      name: "iPhone SE (home button)",
      free: false,
      w: 375,
      h: 667,
      scale: 0.78,
      radius: 28,
      overlay: "status-bar",
      clock: { x: 0.1, y: 0.08, w: 0.8, h: 0.12 },
      safe: { x: 0.08, y: 0.22, w: 0.84, h: 0.48 }
    },
    {
      id: "pixel-8",
      name: "Pixel 8 (punch-hole)",
      free: true,
      w: 412,
      h: 915,
      scale: 0.68,
      radius: 36,
      overlay: "punch-hole",
      hole: { cx: 0.5, cy: 0.035, r: 0.018 },
      clock: { x: 0.1, y: 0.1, w: 0.8, h: 0.13 },
      safe: { x: 0.07, y: 0.26, w: 0.86, h: 0.44 }
    },
    {
      id: "galaxy-s24",
      name: "Galaxy S24 (punch-hole)",
      free: false,
      w: 360,
      h: 780,
      scale: 0.75,
      radius: 32,
      overlay: "punch-hole",
      hole: { cx: 0.5, cy: 0.032, r: 0.016 },
      clock: { x: 0.1, y: 0.09, w: 0.8, h: 0.14 },
      safe: { x: 0.07, y: 0.26, w: 0.86, h: 0.44 }
    },
    {
      id: "android-generic",
      name: "Android generic (hole TL)",
      free: false,
      w: 360,
      h: 800,
      scale: 0.74,
      radius: 28,
      overlay: "punch-hole",
      hole: { cx: 0.12, cy: 0.04, r: 0.02 },
      clock: { x: 0.12, y: 0.1, w: 0.76, h: 0.13 },
      safe: { x: 0.08, y: 0.26, w: 0.84, h: 0.45 }
    }
  ];

  const cfg = window.LOCKFIT_CONFIG || { checkoutUrl: "" };
  /* Seed test keys in app.js only — never put license keys in public config.js */
  const VALID_KEYS = new Set([
    "IB-LOCK-LHRC-MKX2",
    "IB-LOCK-ZYFL-TT8Z",
    "IB-LOCK-N5KS-5RHT",
    "IB-LOCK-X8FD-Y9RX",
    "IB-LOCK-EY47-SWTP",
    "IB-LOCK-G99Q-HZJH",
    "IB-LOCK-XSDV-3M2H",
    "IB-LOCK-HGLA-XRLT",
    "IB-LOCK-MR6T-DFHY",
    "IB-LOCK-YVFS-UZ2N",
    "IB-LOCK-A27E-QQ28",
    "IB-LOCK-6YYV-PAE8",
    "IB-LOCK-SZEM-YGMP",
    "IB-LOCK-DBJC-K6ZE",
    "IB-LOCK-78NF-QNCN"
  ].map((k) => normalizeKey(k)));
  const validKeys = VALID_KEYS;

  let unlocked = false;
  let currentDevice = DEVICES.find((d) => d.id === FREE_DEVICE_IDS[0]) || DEVICES[0];
  let imgNatural = { w: 0, h: 0 };
  let transform = { x: 0, y: 0, scale: 1 };
  let drag = null;

  const $ = (id) => document.getElementById(id);
  const els = {
    deviceList: $("deviceList"),
    phoneFrame: $("phoneFrame"),
    wallpaperLayer: $("wallpaperLayer"),
    wallpaperImg: $("wallpaperImg"),
    overlayLayer: $("overlayLayer"),
    safeGuide: $("safeGuide"),
    placeholderHint: $("placeholderHint"),
    fileInput: $("fileInput"),
    uploadZone: $("uploadZone"),
    fileName: $("fileName"),
    zoomRange: $("zoomRange"),
    zoomLabel: $("zoomLabel"),
    showGuides: $("showGuides"),
    showOverlay: $("showOverlay"),
    btnReset: $("btnReset"),
    btnExport: $("btnExport"),
    btnUnlock: $("btnUnlock"),
    unlockLink: $("unlockLink"),
    unlockNearExport: $("unlockNearExport"),
    unlockInline: $("unlockInline"),
    stickyUnlock: $("stickyUnlock"),
    stickyUnlockBtn: $("stickyUnlockBtn"),
    footerUnlock: $("footerUnlock"),
    footerBuy: $("footerBuy"),
    freeNote: $("freeNote"),
    licenseBadge: $("licenseBadge"),
    unlockModal: $("unlockModal"),
    licenseInput: $("licenseInput"),
    btnRedeem: $("btnRedeem"),
    btnCloseModal: $("btnCloseModal"),
    modalMsg: $("modalMsg"),
    checkoutLink: $("checkoutLink"),
    checkoutPlaceholder: $("checkoutPlaceholder"),
    checkoutHint: $("checkoutHint"),
    exportNote: $("exportNote"),
    toast: $("toast"),
    appRoot: $("appRoot")
  };

  function normalizeKey(k) {
    return String(k || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
  }

  function isUnlocked() {
    return unlocked;
  }

  function loadLicense() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const key = normalizeKey(raw);
      if (!key || key === "1") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SOURCE_KEY);
        return;
      }
      if (validKeys.has(key) || localStorage.getItem(SOURCE_KEY) === "gumroad") {
        unlocked = true;
      } else {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SOURCE_KEY);
      }
    } catch (_) {}
  }

  function saveLicense(key, viaGumroad) {
    try {
      localStorage.setItem(STORAGE_KEY, key);
      localStorage.setItem(SOURCE_KEY, viaGumroad ? "gumroad" : "seed");
    } catch (_) {}
  }

  async function verifyGumroadLicense(rawKey) {
    const productId = String(cfg.productId || cfg.product_id || "").trim();
    const permalink = String(cfg.productPermalink || cfg.product_permalink || "").trim();
    if (!productId && !permalink) {
      return { ok: false, message: "Product not configured for license verify." };
    }
    const body = new URLSearchParams();
    if (productId) body.set("product_id", productId);
    else body.set("product_permalink", permalink);
    body.set("license_key", String(rawKey || "").trim());
    const res = await fetch("https://api.gumroad.com/v2/licenses/verify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    let data = null;
    try { data = await res.json(); } catch (_) { data = null; }
    if (data && data.success === true) {
      const p = data.purchase || {};
      if (p.refunded || p.chargebacked || p.disputed) {
        return { ok: false, message: "This license is no longer valid." };
      }
      return { ok: true, data: data };
    }
    return {
      ok: false,
      message: (data && (data.message || data.error)) || "Invalid key. Check and try again."
    };
  }

  function applyUnlockUI() {
    if (unlocked) {
      els.licenseBadge.textContent = "Unlocked";
      els.licenseBadge.classList.add("unlocked");
      els.btnUnlock.textContent = "Unlocked ✓";
      els.btnUnlock.disabled = true;
      els.exportNote.textContent = "Unlocked: all devices · no watermark on export.";
      if (els.freeNote) els.freeNote.hidden = true;
      if (els.unlockInline) els.unlockInline.hidden = true;
      if (els.stickyUnlock) els.stickyUnlock.hidden = true;
      document.body.classList.remove("has-sticky-unlock");
      if (els.footerUnlock) els.footerUnlock.hidden = true;
      if (els.footerBuy) els.footerBuy.hidden = true;
      document.body.classList.add("ads-hidden");
      document.querySelectorAll("[data-ad]").forEach((el) => {
        el.hidden = true;
      });
    } else {
      els.licenseBadge.textContent = "Free";
      els.licenseBadge.classList.remove("unlocked");
      els.btnUnlock.textContent = "Unlock $2.99";
      els.btnUnlock.disabled = false;
      els.exportNote.textContent =
        "Free exports include a LockFit watermark. Unlock for clean PNGs + all devices.";
      if (els.freeNote) els.freeNote.hidden = false;
      if (els.unlockInline) els.unlockInline.hidden = false;
      if (els.stickyUnlock) els.stickyUnlock.hidden = false;
      document.body.classList.add("has-sticky-unlock");
      if (els.footerUnlock) els.footerUnlock.hidden = false;
      if (els.footerBuy) els.footerBuy.hidden = false;
      document.body.classList.remove("ads-hidden");
      document.querySelectorAll("[data-ad]").forEach((el) => {
        el.hidden = false;
      });
    }
    renderDeviceList();
  }

  function canUseDevice(d) {
    return unlocked || d.free || FREE_DEVICE_IDS.includes(d.id);
  }

  function renderDeviceList() {
    els.deviceList.innerHTML = "";
    DEVICES.forEach((d) => {
      const allowed = canUseDevice(d);
      const item = document.createElement("button");
      item.type = "button";
      item.className =
        "device-item" +
        (d.id === currentDevice.id ? " active" : "") +
        (!allowed ? " locked" : "");
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", d.id === currentDevice.id ? "true" : "false");
      item.innerHTML =
        `<span>${escapeHtml(d.name)}</span>` +
        (!allowed ? '<span class="lock-icon" title="Unlock required">🔒</span>' : "");
      item.addEventListener("click", () => {
        if (!allowed) {
          openUnlockModal();
          showToast("Unlock to use " + d.name);
          return;
        }
        currentDevice = d;
        setupPhone();
        renderDeviceList();
      });
      els.deviceList.appendChild(item);
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function setupPhone() {
    const d = currentDevice;
    const pw = Math.round(d.w * d.scale);
    const ph = Math.round(d.h * d.scale);
    els.phoneFrame.style.width = pw + "px";
    els.phoneFrame.style.height = ph + "px";
    els.phoneFrame.style.borderRadius = d.radius * d.scale + "px";
    renderOverlay();
    updateSafeGuide();
    applyTransform();
  }

  function renderOverlay() {
    const d = currentDevice;
    const show = els.showOverlay.checked;
    els.overlayLayer.style.display = show ? "block" : "none";
    if (!show) {
      els.overlayLayer.innerHTML = "";
      return;
    }

    const w = 100;
    const h = 100;
    let shapes = "";

    // Dim status / top chrome
    shapes += `<rect x="0" y="0" width="${w}" height="4" fill="rgba(0,0,0,0.35)"/>`;

    if (d.overlay === "dynamic-island" && d.island) {
      const ix = (d.island.cx - d.island.w / 2) * w;
      const iy = d.island.cy * h;
      const iw = d.island.w * w;
      const ih = d.island.h * h;
      shapes += `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="${ih / 2}" fill="#0a0a0a" stroke="#222" stroke-width="0.3"/>`;
      shapes += `<circle cx="${ix + iw * 0.78}" cy="${iy + ih / 2}" r="${ih * 0.22}" fill="#1a1a1a"/>`;
    } else if (d.overlay === "notch" && d.notch) {
      const nx = (d.notch.cx - d.notch.w / 2) * w;
      const ny = d.notch.cy * h;
      const nw = d.notch.w * w;
      const nh = d.notch.h * h;
      shapes += `<path d="M ${nx} ${ny} L ${nx + nw} ${ny} L ${nx + nw} ${ny + nh * 0.7} Q ${nx + nw} ${ny + nh} ${nx + nw - 4} ${ny + nh} L ${nx + 4} ${ny + nh} Q ${nx} ${ny + nh} ${nx} ${ny + nh * 0.7} Z" fill="#0a0a0a"/>`;
    } else if (d.overlay === "punch-hole" && d.hole) {
      const hx = d.hole.cx * w;
      const hy = d.hole.cy * h;
      const hr = d.hole.r * w;
      shapes += `<circle cx="${hx}" cy="${hy}" r="${hr}" fill="#0a0a0a" stroke="#333" stroke-width="0.25"/>`;
      shapes += `<circle cx="${hx}" cy="${hy}" r="${hr * 0.45}" fill="#1a1a2e"/>`;
    }

    // Clock / widget safe zone (translucent)
    if (d.clock) {
      const cx = d.clock.x * w;
      const cy = d.clock.y * h;
      const cw = d.clock.w * w;
      const ch = d.clock.h * h;
      shapes += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="2" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" stroke-width="0.3" stroke-dasharray="2 1.5"/>`;
      shapes += `<text x="${cx + cw / 2}" y="${cy + ch * 0.55}" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="6" font-family="system-ui,sans-serif">9:41</text>`;
    }

    // Bottom home indicator
    shapes += `<rect x="35" y="94" width="30" height="1.8" rx="0.9" fill="rgba(255,255,255,0.45)"/>`;

    els.overlayLayer.innerHTML = `<svg class="overlay-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${shapes}</svg>`;
  }

  function updateSafeGuide() {
    const d = currentDevice;
    const show = els.showGuides.checked && d.safe;
    if (!show) {
      els.safeGuide.hidden = true;
      return;
    }
    els.safeGuide.hidden = false;
    els.safeGuide.style.left = d.safe.x * 100 + "%";
    els.safeGuide.style.top = d.safe.y * 100 + "%";
    els.safeGuide.style.width = d.safe.w * 100 + "%";
    els.safeGuide.style.height = d.safe.h * 100 + "%";
  }

  function coverScale() {
    const d = currentDevice;
    if (!imgNatural.w || !imgNatural.h) return 1;
    const frameW = d.w * d.scale;
    const frameH = d.h * d.scale;
    return Math.max(frameW / imgNatural.w, frameH / imgNatural.h);
  }

  function applyTransform() {
    const img = els.wallpaperImg;
    if (img.hidden || !imgNatural.w) return;
    const base = coverScale();
    const s = base * transform.scale;
    const dispW = imgNatural.w * s;
    const dispH = imgNatural.h * s;
    img.style.width = dispW + "px";
    img.style.height = dispH + "px";
    img.style.left = "50%";
    img.style.top = "50%";
    img.style.transform = `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px))`;
    els.zoomLabel.textContent = Math.round(transform.scale * 100) + "%";
    els.zoomRange.value = String(Math.round(transform.scale * 100));
  }

  function resetTransform() {
    transform = { x: 0, y: 0, scale: 1 };
    applyTransform();
  }

  function loadImageFile(file) {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = els.wallpaperImg;
    img.onload = () => {
      imgNatural = { w: img.naturalWidth, h: img.naturalHeight };
      img.hidden = false;
      els.placeholderHint.hidden = true;
      els.btnExport.disabled = false;
      els.fileName.textContent = file.name + ` (${img.naturalWidth}×${img.naturalHeight})`;
      resetTransform();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      showToast("Could not load image");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function wireCheckoutLinks() {
    const url = (cfg.checkoutUrl || "").trim();
    const hint = els.checkoutHint;
    const links = document.querySelectorAll("[data-checkout]");
    links.forEach(function (el) {
      if (url) {
        el.href = url;
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener");
        el.removeAttribute("aria-disabled");
        el.hidden = false;
        el.onclick = null;
      } else {
        el.href = "#";
        el.setAttribute("aria-disabled", "true");
        el.onclick = function (e) {
          e.preventDefault();
          if (els.checkoutPlaceholder) {
            els.checkoutPlaceholder.hidden = false;
          }
        };
      }
    });
    if (els.checkoutLink) {
      if (url) {
        els.checkoutLink.href = url;
        els.checkoutLink.hidden = false;
        if (els.checkoutPlaceholder) els.checkoutPlaceholder.hidden = true;
      } else {
        els.checkoutLink.hidden = true;
        if (els.checkoutPlaceholder) els.checkoutPlaceholder.hidden = false;
      }
    }
    if (hint) {
      if (url) {
        hint.hidden = false;
        hint.className = "checkout-hint soft";
        hint.textContent =
          "After checkout, your store email includes a license key. Paste it below.";
      } else {
        hint.hidden = true;
      }
    }
  }

  function openUnlockModal() {
    els.modalMsg.textContent = "";
    els.modalMsg.className = "modal-msg";
    els.licenseInput.value = "";
    wireCheckoutLinks();
    els.unlockModal.hidden = false;
    els.licenseInput.focus();
  }

  function closeUnlockModal() {
    els.unlockModal.hidden = true;
  }

  async function redeemKey() {
    const raw = String(els.licenseInput.value || "").trim();
    const key = normalizeKey(raw);
    if (!key) {
      els.modalMsg.textContent = "Enter a license key.";
      els.modalMsg.className = "modal-msg error";
      return;
    }
    if (validKeys.has(key)) {
      unlocked = true;
      saveLicense(key, false);
      applyUnlockUI();
      els.modalMsg.textContent = "Unlocked — thank you!";
      els.modalMsg.className = "modal-msg ok";
      showToast("LockFit unlocked");
      setTimeout(closeUnlockModal, 700);
      return;
    }
    if (els.btnRedeem) els.btnRedeem.disabled = true;
    els.modalMsg.textContent = "Checking license…";
    els.modalMsg.className = "modal-msg";
    try {
      const result = await verifyGumroadLicense(raw);
      if (result.ok) {
        unlocked = true;
        saveLicense(key, true);
        applyUnlockUI();
        els.modalMsg.textContent = "Unlocked — thank you!";
        els.modalMsg.className = "modal-msg ok";
        showToast("LockFit unlocked");
        setTimeout(closeUnlockModal, 700);
        return;
      }
      els.modalMsg.textContent = result.message || "Invalid key. Check and try again.";
      els.modalMsg.className = "modal-msg error";
    } catch (_) {
      els.modalMsg.textContent = "Could not verify license. Check your connection and try again.";
      els.modalMsg.className = "modal-msg error";
    } finally {
      if (els.btnRedeem) els.btnRedeem.disabled = false;
    }
  }

  /**
   * Export wallpaper crop matching the phone frame viewport,
   * optionally compositing the UI overlay; watermark if free.
   */
  function exportPng() {
    if (!imgNatural.w) return;
    const d = currentDevice;
    const mode =
      (document.querySelector('input[name="exportMode"]:checked') || {}).value ||
      "safe";
    const outW = d.w * 3; // ~3x logical for sharper PNG
    const outH = d.h * 3;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");

    // Map preview transform to full-res frame
    const frameW = d.w * d.scale;
    const frameH = d.h * d.scale;
    const base = coverScale();
    const sPrev = base * transform.scale;
    // Image size in preview px
    const prevImgW = imgNatural.w * sPrev;
    const prevImgH = imgNatural.h * sPrev;
    // Image top-left in frame coords (preview)
    const imgLeft = frameW / 2 + transform.x - prevImgW / 2;
    const imgTop = frameH / 2 + transform.y - prevImgH / 2;
    // Scale factor preview → export
    const k = outW / frameW;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(
      els.wallpaperImg,
      imgLeft * k,
      imgTop * k,
      prevImgW * k,
      prevImgH * k
    );

    if (mode === "overlay") {
      drawOverlayOnCanvas(ctx, outW, outH, d);
    }

    if (!unlocked) {
      drawWatermark(ctx, outW, outH);
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          showToast("Export failed");
          return;
        }
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `lockfit-${d.id}${unlocked ? "" : "-preview"}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast(unlocked ? "Exported PNG" : "Exported (watermarked)");
      },
      "image/png"
    );
  }

  function drawOverlayOnCanvas(ctx, outW, outH, d) {
    ctx.save();
    // Top dim
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, outW, outH * 0.04);

    if (d.overlay === "dynamic-island" && d.island) {
      const ix = (d.island.cx - d.island.w / 2) * outW;
      const iy = d.island.cy * outH;
      const iw = d.island.w * outW;
      const ih = d.island.h * outH;
      roundRect(ctx, ix, iy, iw, ih, ih / 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
    } else if (d.overlay === "notch" && d.notch) {
      const nx = (d.notch.cx - d.notch.w / 2) * outW;
      const nw = d.notch.w * outW;
      const nh = d.notch.h * outH;
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.moveTo(nx, 0);
      ctx.lineTo(nx + nw, 0);
      ctx.lineTo(nx + nw, nh * 0.75);
      ctx.quadraticCurveTo(nx + nw, nh, nx + nw - 12, nh);
      ctx.lineTo(nx + 12, nh);
      ctx.quadraticCurveTo(nx, nh, nx, nh * 0.75);
      ctx.closePath();
      ctx.fill();
    } else if (d.overlay === "punch-hole" && d.hole) {
      const hx = d.hole.cx * outW;
      const hy = d.hole.cy * outH;
      const hr = d.hole.r * outW;
      ctx.beginPath();
      ctx.arc(hx, hy, hr, 0, Math.PI * 2);
      ctx.fillStyle = "#0a0a0a";
      ctx.fill();
    }

    if (d.clock) {
      const cx = d.clock.x * outW;
      const cy = d.clock.y * outH;
      const cw = d.clock.w * outW;
      const ch = d.clock.h * outH;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = `600 ${Math.round(ch * 0.45)}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("9:41", cx + cw / 2, cy + ch / 2);
    }

    // Home indicator
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    roundRect(ctx, outW * 0.35, outH * 0.94, outW * 0.3, outH * 0.012, 4);
    ctx.fill();
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawWatermark(ctx, w, h) {
    ctx.save();
    ctx.font = `600 ${Math.max(18, Math.round(w * 0.045))}px system-ui,sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = "LockFit · unlock for clean export";
    ctx.translate(w / 2, h * 0.88);
    ctx.rotate((-18 * Math.PI) / 180);
    ctx.strokeText(text, 0, 0);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      els.toast.hidden = true;
    }, 2200);
  }

  // —— Events ——
  els.fileInput.addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if (f) loadImageFile(f);
  });

  ["dragenter", "dragover"].forEach((ev) => {
    els.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.uploadZone.classList.add("dragover");
    });
  });
  ["dragleave", "drop"].forEach((ev) => {
    els.uploadZone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.uploadZone.classList.remove("dragover");
    });
  });
  els.uploadZone.addEventListener("drop", (e) => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadImageFile(f);
  });

  els.zoomRange.addEventListener("input", () => {
    transform.scale = Number(els.zoomRange.value) / 100;
    applyTransform();
  });
  els.btnReset.addEventListener("click", resetTransform);
  els.showGuides.addEventListener("change", updateSafeGuide);
  els.showOverlay.addEventListener("change", renderOverlay);
  els.btnExport.addEventListener("click", exportPng);
  els.btnUnlock.addEventListener("click", openUnlockModal);
  if (els.unlockLink) els.unlockLink.addEventListener("click", openUnlockModal);
  if (els.unlockNearExport) els.unlockNearExport.addEventListener("click", openUnlockModal);
  if (els.stickyUnlockBtn) els.stickyUnlockBtn.addEventListener("click", openUnlockModal);
  if (els.footerUnlock) els.footerUnlock.addEventListener("click", openUnlockModal);
  els.btnCloseModal.addEventListener("click", closeUnlockModal);
  els.btnRedeem.addEventListener("click", redeemKey);
  els.licenseInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") redeemKey();
  });
  els.unlockModal.addEventListener("click", (e) => {
    if (e.target === els.unlockModal) closeUnlockModal();
  });

  // Pan
  els.wallpaperLayer.addEventListener("pointerdown", (e) => {
    if (els.wallpaperImg.hidden) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: transform.x, oy: transform.y };
    els.wallpaperLayer.setPointerCapture(e.pointerId);
    els.wallpaperLayer.classList.add("dragging");
  });
  els.wallpaperLayer.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    transform.x = drag.ox + (e.clientX - drag.x);
    transform.y = drag.oy + (e.clientY - drag.y);
    applyTransform();
  });
  function endDrag(e) {
    if (drag && drag.id === e.pointerId) {
      drag = null;
      els.wallpaperLayer.classList.remove("dragging");
    }
  }
  els.wallpaperLayer.addEventListener("pointerup", endDrag);
  els.wallpaperLayer.addEventListener("pointercancel", endDrag);

  // Wheel zoom
  els.phoneFrame.addEventListener(
    "wheel",
    (e) => {
      if (els.wallpaperImg.hidden) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      transform.scale = Math.min(3, Math.max(0.5, transform.scale + delta));
      applyTransform();
    },
    { passive: false }
  );

  // Init
  loadLicense();
  wireCheckoutLinks();
  applyUnlockUI();
  setupPhone();
})();
