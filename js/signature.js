// Signature pad implementation
(function() {
  function initSignaturePad(canvasEl, options = {}) {
    const ctx = canvasEl.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    let paths = [];
    let currentPath = [];
    let drawing = false;
    const onChange = options.onChange || function(){};

    function resize() {
      const rect = canvasEl.getBoundingClientRect();
      canvasEl.width = rect.width * dpr;
      canvasEl.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      redraw();
    }

    function redraw() {
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      paths.forEach(path => {
        ctx.beginPath();
        path.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      });
    }

    function startDraw(x, y) {
      drawing = true;
      currentPath = [[x, y]];
      paths.push(currentPath);
      redraw();
    }

    function moveDraw(x, y) {
      if (!drawing) return;
      currentPath.push([x, y]);
      redraw();
      onChange();
    }

    function endDraw() {
      drawing = false;
      currentPath = [];
    }

    function getPos(e) {
      const rect = canvasEl.getBoundingClientRect();
      if (e.touches && e.touches[0]) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }

    canvasEl.addEventListener('mousedown', (e) => {
      const { x, y } = getPos(e);
      startDraw(x, y);
    });
    canvasEl.addEventListener('mousemove', (e) => {
      const { x, y } = getPos(e);
      moveDraw(x, y);
    });
    canvasEl.addEventListener('mouseup', endDraw);
    canvasEl.addEventListener('mouseleave', endDraw);

    canvasEl.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      startDraw(x, y);
    }, { passive: false });
    canvasEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const { x, y } = getPos(e);
      moveDraw(x, y);
    }, { passive: false });
    canvasEl.addEventListener('touchend', (e) => {
      e.preventDefault();
      endDraw();
    }, { passive: false });

    window.addEventListener('resize', resize);
    resize();

    function clear() {
      paths = [];
      redraw();
      onChange();
    }

    function setImage(dataUrl) {
      const img = new Image();
      img.onload = function() {
        clear();
        ctx.drawImage(img, 0, 0, canvasEl.width / dpr, canvasEl.height / dpr);
        onChange();
      };
      img.src = dataUrl;
    }

    function toDataURL() {
      return canvasEl.toDataURL();
    }

    function stampTimestamp(ts) {
      const fontSize = 12;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = '#000';
      ctx.fillText(ts, 4, canvasEl.height / dpr - 4);
    }

    return { clear, setImage, toDataURL, stampTimestamp };
  }

  window.initSignaturePad = initSignaturePad;
})();
