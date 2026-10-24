const TUTORIAL_KEY = "control_laboral_tutorial_v1";

export function shouldShowTutorial() {
  return localStorage.getItem(TUTORIAL_KEY) !== "1";
}

export function resetTutorial() {
  localStorage.removeItem(TUTORIAL_KEY);
}

export function startTutorial({ onNavigate, openSettings, closeModal }) {
  if (!shouldShowTutorial()) return;

  const steps = [
    {
      title: "Tu calendario",
      text: "Esta es la pantalla principal. Acá ves el ciclo de facturación, los días trabajados, domingos, feriados, sábados y los estados de cada jornada.",
      selector: ".cl-month-nav"
    },
    {
      title: "Abrir el registro del día",
      text: "Hacé doble toque sobre cualquier día del calendario para abrir el registro de entrada y salida de esa fecha.",
      selector: ".cl-day:not(.outside)"
    },
    {
      title: "Registrar entrada y salida",
      text: "Con un toque registrás la hora actual. Cuando ya existe una marcación, queda bloqueada para un toque accidental; con triple toque podés corregirla o ingresar la hora manualmente.",
      selector: ".cl-day:not(.outside)"
    },
    {
      title: "Francos desde el registro",
      text: "Dentro del registro del día podés usar un franco entero o un medio franco. También podés cubrir el día con medios francos según el saldo disponible.",
      selector: ".cl-day:not(.outside)"
    },
    {
      title: "Jornales del ciclo",
      text: "En Jornales podés ver cuántos jornales enteros corresponden al ciclo. Hacé doble toque para consultar exactamente qué días los generaron.",
      selector: '[data-summary-detail="jornales"]',
      before: () => onNavigate("summary")
    },
    {
      title: "Extras al 50 %",
      text: "Muestra las horas extras al 50 % del ciclo. Con doble toque ves el listado de fechas y cuántas horas generó cada jornada.",
      selector: '[data-summary-detail="extra50"]',
      before: () => onNavigate("summary")
    },
    {
      title: "Extras al 100 %",
      text: "Muestra las horas extras al 100 %. Con doble toque ves qué días las generaron y la cantidad correspondiente a cada uno.",
      selector: '[data-summary-detail="extra100"]',
      before: () => onNavigate("summary")
    },
    {
      title: "Control de jornada y revisiones",
      text: "Las Revisiones señalan jornadas que necesitan atención. Hacé doble toque para ver cada fecha y el motivo de la revisión.",
      selector: '[data-review-detail]',
      before: () => onNavigate("summary")
    },
    {
      title: "Francos disponibles y adeudados",
      text: "En Francos se controlan por separado los francos y medios francos disponibles, utilizados y adeudados. Los saldos se actualizan cuando generás o gastás alguno.",
      selector: '[data-screen="leaves"]',
      before: () => onNavigate("leaves")
    },
    {
      title: "Días que generaron francos",
      text: "Los botones de francos y medios francos muestran los días que los generaron. Los usados aparecen diferenciados y podés entrar al día con doble toque.",
      selector: '[data-screen="leaves"]',
      before: () => onNavigate("leaves")
    },
    {
      title: "Historial",
      text: "Historial registra los cambios importantes de la aplicación: marcaciones, correcciones, francos generados o utilizados, cambios de turno y otras acciones de prueba.",
      selector: '[data-screen="history"]',
      before: () => onNavigate("history")
    },
    {
      title: "Configuración laboral",
      text: "Acá podés ajustar la tolerancia de minutos, el redondeo de entrada y salida y la regla opcional de generación de franco por feriado trabajado. Los cambios se confirman con Guardar.",
      selector: "#cl-setting-tolerance",
      before: () => openSettings()
    },
    {
      title: "Regla de feriados",
      text: "Esta opción permite activar o desactivar que un feriado trabajado genere un franco cuando supera las 8 horas. Por defecto está desactivada.",
      selector: "#cl-setting-holiday-leave",
      before: () => openSettings()
    },
    {
      title: "Modo claro y oscuro",
      text: "Podés cambiar el aspecto de la aplicación entre modo claro y oscuro. Es solamente visual: no modifica registros ni cálculos.",
      selector: "#cl-setting-theme",
      before: () => openSettings()
    },
    {
      title: "Exportar e importar respaldos",
      text: "Desde Datos podés exportar un respaldo JSON de tus registros o importar uno guardado anteriormente. Es la forma de recuperar la información si se borran los datos del navegador.",
      selector: "#cl-export",
      before: () => openSettings()
    },
    {
      title: "Guardar la configuración",
      text: "Cuando cambies una configuración, tocá Guardar para confirmar los cambios. Cancelar descarta los cambios realizados en esa apertura.",
      selector: "#cl-settings-save",
      before: () => openSettings()
    }
  ];

  let index = 0;
  let overlay = null;

  function finish() {
    localStorage.setItem(TUTORIAL_KEY, "1");
    if (overlay) overlay.remove();
    overlay = null;
    closeModal?.();
    onNavigate("calendar");
  }

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "cl-tutorial-overlay";
    overlay.innerHTML = `
      <div class="cl-tutorial-dim"></div>
      <div class="cl-tutorial-focus" aria-hidden="true"></div>
      <section class="cl-tutorial-card" role="dialog" aria-modal="true" aria-label="Tutorial">
        <div class="cl-tutorial-step" id="cl-tutorial-step"></div>
        <h2 id="cl-tutorial-title"></h2>
        <p id="cl-tutorial-text"></p>
        <div class="cl-tutorial-actions">
          <button type="button" class="cl-btn cl-btn-secondary" id="cl-tutorial-skip">Saltar</button>
          <div class="cl-tutorial-progress" id="cl-tutorial-progress"></div>
          <button type="button" class="cl-btn cl-btn-primary" id="cl-tutorial-next">Siguiente</button>
        </div>
      </section>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#cl-tutorial-skip").addEventListener("click", finish);
    overlay.querySelector("#cl-tutorial-next").addEventListener("click", () => {
      if (index >= steps.length - 1) finish();
      else { index += 1; showStep(); }
    });
  }

  function position() {
    if (!overlay) return;
    const step = steps[index];
    const target = document.querySelector(step.selector);
    const focus = overlay.querySelector(".cl-tutorial-focus");
    const card = overlay.querySelector(".cl-tutorial-card");
    if (!target || !card) {
      focus.style.display = "none";
      card.style.top = "auto";
      card.style.bottom = "calc(14px + env(safe-area-inset-bottom))";
      return;
    }

    target.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
    const rect = target.getBoundingClientRect();
    const pad = 7;
    const gap = 12;
    const margin = 10;

    focus.style.display = "block";
    focus.style.left = `${Math.max(6, rect.left - pad)}px`;
    focus.style.top = `${Math.max(6, rect.top - pad)}px`;
    focus.style.width = `${Math.min(window.innerWidth - 12, rect.width + pad * 2)}px`;
    focus.style.height = `${Math.min(window.innerHeight - 12, rect.height + pad * 2)}px`;

    // El tutorial se coloca según la posición del elemento señalado:
    // arriba de la pantalla -> tarjeta debajo; abajo -> tarjeta arriba.
    const cardHeight = card.getBoundingClientRect().height;
    const viewportHeight = window.innerHeight;
    const targetCenter = rect.top + rect.height / 2;
    let desiredTop;

    if (targetCenter <= viewportHeight / 2) {
      desiredTop = rect.bottom + gap;
      if (desiredTop + cardHeight > viewportHeight - margin) {
        desiredTop = rect.top - cardHeight - gap;
      }
    } else {
      desiredTop = rect.top - cardHeight - gap;
      if (desiredTop < margin) {
        desiredTop = rect.bottom + gap;
      }
    }

    desiredTop = Math.max(margin, Math.min(desiredTop, viewportHeight - cardHeight - margin));
    card.style.top = `${desiredTop}px`;
    card.style.bottom = "auto";
  }

  function showStep() {
    const step = steps[index];
    step.before?.();
    ensureOverlay();
    const title = overlay.querySelector("#cl-tutorial-title");
    const text = overlay.querySelector("#cl-tutorial-text");
    const stepNo = overlay.querySelector("#cl-tutorial-step");
    const progress = overlay.querySelector("#cl-tutorial-progress");
    const next = overlay.querySelector("#cl-tutorial-next");
    stepNo.textContent = `${index + 1} de ${steps.length}`;
    title.textContent = step.title;
    text.textContent = step.text;
    progress.innerHTML = steps.map((_, i) => `<span class="${i === index ? "active" : ""}"></span>`).join("");
    next.textContent = index === steps.length - 1 ? "Finalizar" : "Siguiente";
    requestAnimationFrame(position);
  }

  window.addEventListener("resize", position);
  showStep();
}
