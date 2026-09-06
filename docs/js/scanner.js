(function () {
  var stream = null;
  var raf = 0;
  var active = false;

  function stop() {
    active = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
  }

  function ensureOverlay() {
    var el = document.getElementById("qrOverlay");
    if (el) return el;
    el = document.createElement("div");
    el.id = "qrOverlay";
    el.className = "qr-overlay hidden";
    el.innerHTML =
      '<div class="qr-panel">' +
      '<header class="qr-header"><strong>QR-Code scannen</strong>' +
      '<button type="button" class="text-btn" id="qrClose">Schließen</button></header>' +
      '<div class="qr-stage"><video id="qrVideo" playsinline muted></video><canvas id="qrCanvas" class="hidden"></canvas>' +
      '<div class="qr-frame" aria-hidden="true"></div></div>' +
      '<p class="muted qr-hint">Kamera auf den Stand-QR richten. Ohne QR: manuell eintragen.</p>' +
      '<label class="primary-btn file-btn">Foto aus Galerie / Kamera' +
      '<input id="qrFile" type="file" accept="image/*" capture="environment" hidden /></label>' +
      "</div>";
    document.body.appendChild(el);
    return el;
  }

  function decodeWithBarcodeDetector(source) {
    if (!("BarcodeDetector" in window)) return Promise.resolve(null);
    var detector = new BarcodeDetector({ formats: ["qr_code"] });
    return detector.detect(source).then(function (codes) {
      return codes && codes[0] ? codes[0].rawValue : null;
    }).catch(function () { return null; });
  }

  function decodeWithJsQR(imageData) {
    if (!window.jsQR) return null;
    var code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
    return code && code.data ? code.data : null;
  }

  function scanImageBitmap(bitmap) {
    var canvas = document.getElementById("qrCanvas");
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    var max = 640;
    var scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return decodeWithBarcodeDetector(canvas).then(function (val) {
      if (val) return val;
      return decodeWithJsQR(ctx.getImageData(0, 0, canvas.width, canvas.height));
    });
  }

  function open(onResult) {
    var overlay = ensureOverlay();
    var video = document.getElementById("qrVideo");
    var fileInput = document.getElementById("qrFile");
    overlay.classList.remove("hidden");
    active = true;

    function finish(value) {
      if (!value) return;
      stop();
      overlay.classList.add("hidden");
      onResult(String(value));
    }

    document.getElementById("qrClose").onclick = function () {
      stop();
      overlay.classList.add("hidden");
    };

    fileInput.onchange = function () {
      var file = fileInput.files && fileInput.files[0];
      if (!file) return;
      createImageBitmap(file).then(function (bmp) {
        return scanImageBitmap(bmp).then(finish);
      }).catch(function () {
        alert("Bild konnte nicht gelesen werden.");
      });
    };

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(function (mediaStream) {
        stream = mediaStream;
        video.srcObject = stream;
        return video.play();
      })
      .then(function () {
        var canvas = document.getElementById("qrCanvas");
        var ctx = canvas.getContext("2d", { willReadFrequently: true });

        function tick() {
          if (!active) return;
          if (video.readyState >= 2) {
            var w = video.videoWidth;
            var h = video.videoHeight;
            if (w && h) {
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              decodeWithBarcodeDetector(canvas).then(function (val) {
                if (val) return finish(val);
                var data = ctx.getImageData(0, 0, w, h);
                var js = decodeWithJsQR(data);
                if (js) finish(js);
              });
            }
          }
          raf = requestAnimationFrame(tick);
        }
        tick();
      })
      .catch(function () {
        // Kamera blockiert – Nutzer kann Foto wählen
      });
  }

  window.IFAScanner = { open: open, stop: stop };
})();
