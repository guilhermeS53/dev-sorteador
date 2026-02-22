<script setup>
import { ref, watch, onMounted, computed } from "vue";

// ─── Estado ────────────────────────────────────────────────────────
const min = ref("");
const max = ref("");
const result = ref("");
const isRolling = ref(false);
const theme = ref("dark");
const menuOpen = ref(false);
const history = ref([]); // [{ result, min, max, time }]
const HISTORY_KEY = "devsorteio:history";
const MAX_HISTORY = 50;

// ─── Tema ──────────────────────────────────────────────────────────
const applyTheme = (val) => {
  theme.value = val;
  document.documentElement.setAttribute("data-theme", val);
  localStorage.setItem("theme", val);
};

/**
 * Transição circular suave — circle() é interpolado nativamente pelo browser,
 * muito mais leve que polygon(). Origin = onde o usuário clicou.
 */
const toggleTheme = (event) => {
  const nextTheme = theme.value === "dark" ? "light" : "dark";

  if (!document.startViewTransition) {
    applyTheme(nextTheme);
    return;
  }

  // Pega coordenadas do clique; fallback para o botão de toggle no drawer
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;

  // Raio pra cobrir a diagonal máxima da tela
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => applyTheme(nextTheme));

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 1000,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)", // spring suave
        pseudoElement: "::view-transition-new(root)",
        composite: "replace",
      },
    );
  });
};

// ─── Sorteio ───────────────────────────────────────────────────────
const generateNumber = () => {
  if (isRolling.value) return;

  const minVal = Math.ceil(Number(min.value));
  const maxVal = Math.floor(Number(max.value));

  if (!min.value || !max.value) {
    alert("Preencha os dois campos!");
    return;
  }
  if (minVal >= maxVal) {
    alert("O valor mínimo deve ser menor que o máximo.");
    return;
  }

  isRolling.value = true;
  let count = 0;
  const total = 14;

  const interval = setInterval(() => {
    result.value = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
    count++;
    if (count >= total) {
      clearInterval(interval);
      const final = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
      result.value = final;
      isRolling.value = false;

      // Registra no histórico
      history.value.unshift({
        result: final,
        min: minVal,
        max: maxVal,
        time: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      });
    }
  }, 60);
};

const clearHistory = () => {
  history.value = [];
  localStorage.removeItem(HISTORY_KEY);
};

// Persiste histórico sempre que mudar (limite 50)
watch(
  history,
  (val) => {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify(val.slice(0, MAX_HISTORY)),
    );
  },
  { deep: true },
);

const historyIsEmpty = computed(() => history.value.length === 0);

// ─── Mount ─────────────────────────────────────────────────────────
onMounted(() => {
  // Tema
  const saved = localStorage.getItem("theme") || "dark";
  theme.value = saved;
  document.documentElement.setAttribute("data-theme", saved);

  // Histórico
  try {
    const savedHistory = localStorage.getItem(HISTORY_KEY);
    if (savedHistory) history.value = JSON.parse(savedHistory);
  } catch {
    history.value = [];
  }
});
</script>

<template>
  <!-- orbs de fundo -->
  <div class="orb orb-1" />
  <div class="orb orb-2" />



  <!-- ── DRAWER LATERAL ── -->
  <Transition name="overlay">
    <div v-if="menuOpen" class="overlay" @click.self="menuOpen = false" />
  </Transition>

  <Transition name="drawer">
    <aside v-if="menuOpen" class="drawer">
      <!-- Não usar header -->
      <!-- <header class="drawer-header">
        <button
          class="drawer-close-btn"
          @click="menuOpen = false"
          aria-label="Fechar menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </header> -->

      <!-- Toggle de tema -->
      <section class="drawer-section">
        <p class="drawer-section-label">Aparência</p>
        <button class="theme-toggle-row" @click="toggleTheme">
          <span class="toggle-icon">
            <!-- sun -->
            <svg
              v-if="theme === 'dark'"
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              />
            </svg>
            <!-- moon -->
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
          <span class="toggle-label">{{
            theme === "dark" ? "Modo Claro" : "Modo Escuro"
          }}</span>
          <span class="toggle-pill">
            <span
              class="toggle-knob"
              :class="{ 'knob-right': theme === 'light' }"
            />
          </span>
        </button>
      </section>

      <!-- Histórico -->
      <section class="drawer-section history-section">
        <div class="history-header">
          <p class="drawer-section-label">Histórico</p>
          <button
            v-if="!historyIsEmpty"
            class="clear-btn"
            @click="clearHistory"
          >
            Limpar
          </button>
        </div>

        <div v-if="historyIsEmpty" class="history-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            opacity="0.35"
          >
            <rect x="2" y="2" width="6" height="6" rx="1" />
            <rect x="16" y="2" width="6" height="6" rx="1" />
            <rect x="2" y="16" width="6" height="6" rx="1" />
            <rect x="16" y="16" width="6" height="6" rx="1" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
          </svg>
          <p>Não há sorteios ainda</p>
        </div>

        <TransitionGroup
          name="history-item"
          tag="ul"
          class="history-list"
          v-else
        >
          <li v-for="(item, i) in history" :key="i" class="history-item">
            <span class="history-result">{{ item.result }}</span>
            <div class="history-meta">
              <span class="history-range">{{ item.min }} a {{ item.max }}</span>
              <span class="history-time">{{ item.time }}</span>
            </div>
          </li>
        </TransitionGroup>
      </section>
    </aside>
  </Transition>

  <!-- ── CARD PRINCIPAL ── -->
  <div class="card">
    <!-- ── BOTÃO HAMBÚRGUER (dentro do card) ── -->
    <button
      class="hamburger-btn"
      :class="{ 'has-history': history.length > 0 }"
      @click="menuOpen = !menuOpen"
      :aria-label="menuOpen ? 'Fechar menu' : 'Abrir menu'"
    >
      <span class="bar" :class="{ open: menuOpen }" />
      <span class="bar" :class="{ open: menuOpen }" />
      <span class="bar" :class="{ open: menuOpen }" />
      <span v-if="history.length > 0 && !menuOpen" class="hamburger-badge">
        {{ history.length > 9 ? "9+" : history.length }}
      </span>
    </button>

    <div class="logo-wrap">
      <svg
        class="logo-svg"
        viewBox="0 0 80 80"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Logo DevSorteio"
      >
        <rect
          x="8"
          y="8"
          width="64"
          height="64"
          rx="14"
          fill="url(#dice-grad)"
        />
        <circle cx="26" cy="26" r="5" fill="white" fill-opacity="0.95" />
        <circle cx="54" cy="26" r="5" fill="white" fill-opacity="0.95" />
        <circle cx="26" cy="54" r="5" fill="white" fill-opacity="0.95" />
        <circle cx="54" cy="54" r="5" fill="white" fill-opacity="0.95" />
        <circle cx="40" cy="40" r="5" fill="white" fill-opacity="0.95" />
        <defs>
          <linearGradient id="dice-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="var(--accent-1)" />
            <stop offset="100%" stop-color="var(--accent-2)" />
          </linearGradient>
        </defs>
      </svg>
      <span class="logo-text">DevSorteio</span>
    </div>

    <p class="subtitle">Gere um número aleatório instantaneamente</p>

    <div class="input-row">
      <div class="input-wrap">
        <span class="input-label">Mínimo</span>
        <input v-model="min" type="number" placeholder="0" />
      </div>
      <div class="divider-arrow">→</div>
      <div class="input-wrap">
        <span class="input-label">Máximo</span>
        <input v-model="max" type="number" placeholder="100" />
      </div>
    </div>

    <div class="result-wrap" :class="{ rolling: isRolling }">
      <span class="result-label">Resultado</span>
      <span class="result-value">{{ result !== "" ? result : "—" }}</span>
    </div>

    <button
      class="btn-sortear"
      :class="{ rolling: isRolling }"
      @click="generateNumber"
    >
      <svg
        v-if="!isRolling"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="2" y="2" width="6" height="6" rx="1" />
        <rect x="16" y="2" width="6" height="6" rx="1" />
        <rect x="2" y="16" width="6" height="6" rx="1" />
        <rect x="16" y="16" width="6" height="6" rx="1" />
        <rect x="9" y="9" width="6" height="6" rx="1" />
      </svg>
      <svg
        v-else
        class="spin"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {{ isRolling ? "Sorteando…" : "Sortear" }}
    </button>

    <p v-if="history.length" class="history-hint">
      <b>{{ history.length }} sorteio{{ history.length > 1 ? "s" : "" }}</b> realizado{{ history.length > 1 ? "s" : "" }}. Consulte o histórico no Menu ☰ acima.
    </p>
  </div>
</template>

<style scoped>
/* ── orbs ── */
.orb {
  position: fixed;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  z-index: 0;
  transition: background var(--t);
}
.orb-1 {
  width: 520px;
  height: 520px;
  background: var(--orb-1);
  top: -120px;
  right: -80px;
}
.orb-2 {
  width: 400px;
  height: 400px;
  background: var(--orb-2);
  bottom: -100px;
  left: -60px;
}

/* ─────────────────────────────────────────
   HAMBÚRGUER
───────────────────────────────────────── */
.hamburger-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 400;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  cursor: pointer;
  transition:
    border-color 0.3s ease,
    background var(--t),
    box-shadow 0.3s ease,
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}
/* quando tem histórico: borda com gradiente sutil */
.hamburger-btn.has-history {
  border-color: rgba(99, 102, 241, 0.45);
  box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.15);
}
.hamburger-btn:hover {
  border-color: var(--border-focus);
  transform: scale(1.12);
  box-shadow: 0 0 0 6px rgba(99, 102, 241, 0.1);
}
.hamburger-btn:active {
  transform: scale(0.94);
}

/* badge de contagem */
.hamburger-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 99px;
  background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border: 2px solid var(--bg-main);
  animation: badge-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes badge-pop {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.bar {
  display: block;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--text-secondary);
  transition:
    transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.2s ease,
    width 0.3s ease,
    background var(--t);
  transform-origin: center;
}
/* barra do meio fica menor no rest */
.bar:nth-child(2) {
  width: 13px;
}
.hamburger-btn:hover .bar:nth-child(2) {
  width: 18px;
}
/* X quando aberto — spring no rotate */
.bar:nth-child(1).open {
  transform: translateY(7px) rotate(45deg);
  width: 18px;
}
.bar:nth-child(2).open {
  opacity: 0;
  transform: scaleX(0);
}
.bar:nth-child(3).open {
  transform: translateY(-7px) rotate(-45deg);
  width: 18px;
}

/* ─────────────────────────────────────────
   OVERLAY
───────────────────────────────────────── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 150;
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(2px);
}
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.35s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* ─────────────────────────────────────────
   DRAWER
───────────────────────────────────────── */
.drawer {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 300;
  width: 320px;
  max-width: 88vw;
  height: 100dvh;
  background: var(--bg-surface);
  backdrop-filter: blur(32px);
  -webkit-backdrop-filter: blur(32px);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  will-change: transform;
}
/* entrada: spring pronunciado; saída: decelerate mais rápido */
.drawer-enter-active {
  transition: transform 0.45s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 1, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(-100%);
}

/* seções do drawer entram escalonadas */
.drawer-enter-active .drawer-header {
  transition:
    opacity 0.25s 0.1s ease,
    transform 0.35s 0.1s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.drawer-enter-active .drawer-section {
  transition:
    opacity 0.25s ease,
    transform 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.drawer-enter-active .drawer-section:nth-child(2) {
  transition-delay: 0.12s;
}
.drawer-enter-active .drawer-section:nth-child(3) {
  transition-delay: 0.18s;
}
.drawer-enter-from .drawer-header,
.drawer-enter-from .drawer-section {
  opacity: 0;
  transform: translateX(-12px);
}

.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-close-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 10px;
  color: var(--text-secondary);
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.drawer-close-btn:hover {
  background: var(--border);
  color: var(--text-primary);
  transform: translateX(3px);
}
.drawer-close-btn:active {
  transform: scale(0.95);
}

.drawer-close-btn svg {
  flex-shrink: 0;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.drawer-close-btn:hover svg {
  transform: rotate(90deg);
}

/* ── seção genérica ── */
.drawer-section {
  padding: 20px;
  border-bottom: 1px solid var(--border);
}
.drawer-section-label {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

/* ── toggle de tema no drawer ── */
.theme-toggle-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition:
    border-color 0.25s,
    background var(--t);
}
.theme-toggle-row:hover {
  border-color: var(--border-focus);
}

.toggle-icon {
  color: var(--accent-1);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.toggle-label {
  flex: 1;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: left;
}

/* pill switch visual */
.toggle-pill {
  width: 36px;
  height: 20px;
  border-radius: 99px;
  background: var(--accent-grad);
  position: relative;
  flex-shrink: 0;
  transition: background var(--t);
}
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toggle-knob.knob-right {
  transform: translateX(16px);
}

/* ─── histórico ─── */
.history-section {
  flex: 1;
  overflow-y: auto;
  border-bottom: none;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.history-header .drawer-section-label {
  margin-bottom: 0;
}
.clear-btn {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--accent-1);
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  transition: background 0.2s;
}
.clear-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 0;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 14px;
  transition: border-color 0.2s;
}
.history-item:hover {
  border-color: var(--border-focus);
}

.history-result {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  background: var(--accent-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  min-width: 48px;
}
.history-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.history-range {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}
.history-time {
  font-size: 0.72rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* animação de entrada dos itens do histórico */
.history-item-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.history-item-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

/* ─────────────────────────────────────────
   CARD PRINCIPAL
───────────────────────────────────────── */
.card {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 520px;
  background: var(--bg-surface);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 48px 40px 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow:
    0 4px 60px rgba(0, 0, 0, 0.25),
    0 1px 0 rgba(255, 255, 255, 0.06) inset;
  animation: floatIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition:
    background var(--t),
    border-color var(--t),
    box-shadow var(--t);
}
@keyframes floatIn {
  from {
    opacity: 0;
    transform: translateY(28px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ── logo ── */
.logo-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.logo-svg {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 8px 24px rgba(99, 102, 241, 0.4));
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.logo-wrap:hover .logo-svg {
  transform: scale(1.08) rotate(-4deg);
}
.logo-text {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.5px;
  background: var(--accent-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── subtítulo ── */
.subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 36px;
  margin-top: 4px;
}

/* ── inputs ── */
.input-row {
  display: flex;
  width: 100%;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 20px;
}
.input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.input-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}
.input-wrap input {
  width: 100%;
  height: 54px;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 14px;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background var(--t),
    color var(--t);
}
.input-wrap input::placeholder {
  color: var(--text-secondary);
  opacity: 0.5;
}
.input-wrap input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
input[type="number"] {
  -webkit-appearance: none;
  appearance: none;
}
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.divider-arrow {
  color: var(--text-secondary);
  font-size: 1.2rem;
  padding-bottom: 14px;
  opacity: 0.5;
}

/* ── resultado ── */
.result-wrap {
  width: 100%;
  background: var(--result-bg);
  border: 1px solid var(--result-border);
  border-radius: 14px;
  padding: 14px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-bottom: 24px;
  transition:
    border-color 0.3s ease,
    box-shadow 0.3s ease,
    background var(--t);
}
.result-wrap.rolling {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}
.result-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-secondary);
}
.result-value {
  font-size: 2.8rem;
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -1px;
  min-height: 1.2em;
  transition: color var(--t);
}
.result-wrap.rolling .result-value {
  background: var(--accent-grad);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ── botão ── */
.btn-sortear {
  width: 100%;
  height: 52px;
  border: none;
  border-radius: 100px;
  background: var(--accent-grad);
  color: #fff;
  font-family: var(--font);
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 24px var(--accent-shadow);
  transition:
    transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.25s ease,
    opacity 0.2s ease;
  margin-bottom: 0;
}
.btn-sortear:hover:not(.rolling) {
  transform: translateY(-3px);
  box-shadow: 0 8px 32px var(--accent-shadow);
}
.btn-sortear:active:not(.rolling) {
  transform: translateY(1px);
  box-shadow: 0 2px 12px var(--accent-shadow);
}
.btn-sortear.rolling {
  opacity: 0.75;
  cursor: not-allowed;
}

.history-hint {
  margin-top: 16px;
  font-size: 0.78rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

/* ── spinner ── */
.spin {
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── responsivo ── */
@media (max-width: 480px) {
  .card {
    padding: 36px 24px 32px;
    border-radius: 22px;
  }
  .logo-svg {
    width: 64px;
    height: 64px;
  }
  .logo-text {
    font-size: 1.3rem;
  }
  .result-value {
    font-size: 2.2rem;
  }
  .input-wrap input {
    font-size: 1.2rem;
  }
}
</style>
