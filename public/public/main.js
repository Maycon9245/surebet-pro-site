// main.js - front-end autônomo (ES module)
(function () {
  'use strict';

  /* ========== Helpers ========== */
  function createEl(tag, attrs = {}, html = '') {
    const el = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') el.className = attrs[k];
      else if (k.startsWith('data-')) el.setAttribute(k, attrs[k]);
      else el[k] = attrs[k];
    }
    if (html) el.innerHTML = html;
    return el;
  }

  /* ========== Toast ========= */
  function showToast(message, type = 'info', duration = 3500) {
    const toast = createEl('div', { class: 'toast toast-' + type }, `<div>${message}</div>`);
    if (type === 'success') toast.classList.add('toast-success');
    if (type === 'error') toast.classList.add('toast-error');
    if (type === 'warning') toast.classList.add('toast-warning');
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* ========== Modal ========= */
  class Modal {
    constructor(id = 'modal', title = '') {
      this.id = id;
      this.title = title;
      this.overlay = null;
    }

    show(innerHtml) {
      this.hide(); // remove se já existir
      const overlay = createEl('div', { class: 'modal-overlay', id: this.id });
      const content = createEl('div', { class: 'modal-content' }, `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="margin:0">${this.title}</h3>
          <button aria-label="fechar" style="background:none;border:none;font-size:20px;cursor:pointer" id="${this.id}-close">×</button>
        </div>
        <div id="${this.id}-body">${innerHtml}</div>
      `);
      overlay.appendChild(content);
      document.body.appendChild(overlay);
      document.getElementById(`${this.id}-close`).addEventListener('click', () => this.hide());
      this.overlay = overlay;
    }

    hide() {
      const existing = document.getElementById(this.id);
      if (existing) existing.remove();
    }
  }

  /* ========== Simple Components (renders HTML strings) ========== */
  function Header(user, theme) {
    const userHtml = user ? `<div>Olá, ${user.email} <button data-action="logout" class="btn-sm">Sair</button></div>` : `<button data-action="login" class="btn btn-primary">Entrar</button>`;
    return `
      <header style="position:fixed;top:0;left:0;right:0;background:var(--bg-primary);border-bottom:1px solid var(--border);z-index:40">
        <div class="container" style="display:flex;align-items:center;justify-content:space-between;padding:1rem 0">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="/logo-surebet-pro.png" alt="logo" style="width:40px;height:40px;object-fit:contain" />
            <div>
              <div class="font-heading" style="font-weight:600">SUREBET PRO</div>
              <div style="font-size:12px;color:var(--text-muted)">Arbitragem esportiva</div>
            </div>
          </div>
          <nav style="display:flex;gap:8px;align-items:center">
            <a href="#" data-page="dashboard" class="btn btn-sm">Dashboard</a>
            <a href="#" data-page="surebets" class="btn btn-sm">Surebets</a>
            <a href="#" data-page="calculator" class="btn btn-sm">Calculadora</a>
            <a href="#" data-page="history" class="btn btn-sm">Histórico</a>
            ${userHtml}
          </nav>
        </div>
      </header>
    `;
  }

  function Dashboard(user) {
    return `
      <div class="container" style="padding-top:100px">
        <div class="grid grid-cols-1 gap-4">
          <div class="card">
            <h2 class="font-heading">Bem-vindo ao SUREBET PRO</h2>
            <p>Use o botão “Surebets” para carregar arbitragens em tempo real.</p>
            <div style="margin-top:12px">
              <button data-page="surebets" class="btn btn-primary">Ver Surebets</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function SurebetsPage() {
    return `
      <div class="container" style="padding-top:100px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 class="font-heading">Surebets em tempo real</h2>
          <div>
            <button id="refreshSurebets" class="btn btn-secondary btn-sm">Atualizar</button>
            <button id="openCalc" class="btn btn-sm" data-page="calculator">Calculadora</button>
          </div>
        </div>
        <div id="surebetsList" class="grid grid-cols-1 gap-4"></div>
      </div>
    `;
  }

  function Calculator() {
    return `
      <div class="container" style="padding-top:100px">
        <div class="card">
          <h3 class="font-heading">Calculadora de Stakes</h3>
          <form id="calcForm" data-form="calculator" style="display:grid;gap:10px;margin-top:10px">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <input type="number" step="0.01" name="odd1" placeholder="Odd Casa 1" class="input" required />
              <input type="number" step="0.01" name="odd2" placeholder="Odd Casa 2" class="input" required />
            </div>
            <input type="number" step="0.01" name="totalInvestment" placeholder="Investimento total (R$)" class="input" />
            <button type="submit" class="btn btn-primary">Calcular</button>
          </form>
          <div id="calculator-results" style="margin-top:12px"></div>
        </div>
      </div>
    `;
  }

  function History() {
    const history = JSON.parse(localStorage.getItem('surebetHistory') || '[]');
    return `
      <div class="container" style="padding-top:100px">
        <div class="card">
          <h3 class="font-heading">Histórico - últimas 100 execuções</h3>
          <div id="historyList" style="margin-top:12px">
            ${history.length ? history.map(h => `<div style="border-bottom:1px solid var(--border);padding:8px 0">
              <strong>${h.homeTeam} x ${h.awayTeam}</strong>
              <div>Executado em: ${new Date(h.executedAt).toLocaleString()}</div>
            </div>`).join('') : '<div>Nenhum histórico.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  function Settings() {
    return `
      <div class="container" style="padding-top:100px">
        <div class="card">
          <h3 class="font-heading">Configurações</h3>
          <p>Configurações irão aqui (modo, notificações, etc.).</p>
        </div>
      </div>
    `;
  }

  function Pricing() {
    return `
      <div class="container" style="padding-top:100px">
        <div class="card">
          <h3 class="font-heading">Planos & Pricing</h3>
          <p>Informações de planos em breve.</p>
        </div>
      </div>
    `;
  }

  /* ========== Services ========== */
  class AuthService {
    async login(email, password) {
      // Simulação (substituir por rota real de auth se for implementar)
      if (!email || !password) throw new Error('Preencha email e senha');
      return { email };
    }
    async register(email, password, name) {
      if (!email || !password) throw new Error('Dados inválidos');
      return { email, name };
    }
  }

  class SurebetService {
    constructor() {
      this.cache = [];
    }
    async fetchSurebets() {
      try {
        const res = await fetch('/api/surebets');
        if (!res.ok) throw new Error('Erro ao buscar surebets');
        const data = await res.json();
        this.cache = Array.isArray(data) ? data : [];
        return this.cache;
      } catch (err) {
        console.error('Erro fetchSurebets:', err);
        this.cache = [];
        return [];
      }
    }
    getLast() {
      return this.cache;
    }
  }

  /* ========== App (controlador) ========== */
  class App {
    constructor() {
      this.currentPage = 'dashboard';
      this.user = null;
      this.authService = new AuthService();
      this.surebetService = new SurebetService();
      this.init();
    }

    init() {
      this.applyTheme();
      this.setupGlobalListeners();
      this.render();
      this.startAutoUpdates();
    }

    applyTheme() {
      const theme = localStorage.getItem('theme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
    }

    setupGlobalListeners() {
      document.addEventListener('click', (e) => {
        const pageBtn = e.target.closest('[data-page]');
        if (pageBtn) {
          e.preventDefault();
          const page = pageBtn.getAttribute('data-page');
          this.navigateTo(page);
          return;
        }
        const actionBtn = e.target.closest('[data-action]');
        if (actionBtn) {
          const action = actionBtn.getAttribute('data-action');
          this.handleAction(action, actionBtn);
        }
      });

      document.addEventListener('submit', async (e) => {
        const form = e.target;
        const formType = form.getAttribute('data-form');
        if (!formType) return;
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        if (formType === 'login') {
          await this.login(data);
        } else if (formType === 'register') {
          await this.register(data);
        } else if (formType === 'calculator') {
          this.calculateStakes(data);
        }
      });
    }

    navigateTo(page) {
      this.currentPage = page;
      this.render();
      if (page === 'surebets') {
        this.loadSurebetsToDOM();
      }
    }

    async handleAction(action) {
      switch (action) {
        case 'login':
          this.showLoginModal();
          break;
        case 'logout':
          this.logout();
          break;
      }
    }

    async login(data) {
      try {
        const user = await this.authService.login(data.email, data.password);
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('Login realizado!', 'success');
        this.render();
      } catch (err) {
        showToast(err.message || 'Erro no login', 'error');
      }
    }

    async register(data) {
      try {
        const user = await this.authService.register(data.email, data.password, data.name);
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('Conta criada!', 'success');
        this.render();
      } catch (err) {
        showToast(err.message || 'Erro no cadastro', 'error');
      }
    }

    logout() {
      this.user = null;
      localStorage.removeItem('user');
      showToast('Logout realizado', 'success');
      this.render();
    }

    showLoginModal() {
      const modal = new Modal('auth-modal', 'Entrar / Registrar');
      modal.show(`
        <div style="display:grid;gap:8px">
          <form data-form="login" id="loginForm" style="display:grid;gap:6px">
            <input name="email" placeholder="Email" class="input" required />
            <input name="password" type="password" placeholder="Senha" class="input" required />
            <button class="btn btn-primary">Entrar</button>
          </form>

          <div style="text-align:center;margin:6px;color:var(--text-muted)">ou</div>

          <form data-form="register" id="registerForm" style="display:grid;gap:6px">
            <input name="name" placeholder="Nome completo" class="input" required />
            <input name="email" placeholder="Email" class="input" required />
            <input name="password" type="password" placeholder="Senha" class="input" required />
            <button class="btn btn-secondary">Criar conta</button>
          </form>
        </div>
      `);
    }

    render() {
      const app = document.getElementById('app');
      app.innerHTML = `
        ${Header(this.user, 'light')}
        <main style="min-height:100vh;padding-top:84px">
          ${this.renderCurrentPage()}
        </main>
      `;
      this.afterRender();
    }

    renderCurrentPage() {
      switch (this.currentPage) {
        case 'dashboard': return Dashboard(this.user);
        case 'surebets': return SurebetsPage();
        case 'calculator': return Calculator();
        case 'history': return History();
        case 'settings': return Settings();
        case 'pricing': return Pricing();
        default: return Dashboard(this.user);
      }
    }

    afterRender() {
      // attach handlers for surebets page buttons
      const refreshBtn = document.getElementById('refreshSurebets');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => this.loadSurebetsToDOM());
      }

      const calcForm = document.getElementById('calcForm');
      if (calcForm) {
        // submit handled by global listener
      }
    }

    async loadSurebetsToDOM() {
      const list = document.getElementById('surebetsList');
      if (!list) return;
      list.innerHTML = '<div class="card">Carregando surebets...</div>';
      const data = await this.surebetService.fetchSurebets();
      if (!data || !Array.isArray(data) || data.length === 0) {
        list.innerHTML = '<div class="card">Nenhuma surebet encontrada no momento.</div>';
        return;
      }
      list.innerHTML = data.map(s => `
        <div class="card fade-in">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <strong>${s.homeTeam} x ${s.awayTeam}</strong>
              <div style="font-size:12px;color:var(--text-muted)">${s.sport} • ${new Date(s.commenceTime).toLocaleString('pt-BR')}</div>
            </div>
            <div style="text-align:right">
              <div>${s.bookmaker1.name}: <strong>${s.bookmaker1.odd}</strong></div>
              <div>${s.bookmaker2.name}: <strong>${s.bookmaker2.odd}</strong></div>
              <div style="margin-top:6px" class="badge badge-success">Lucro ${s.profitPercentage}%</div>
            </div>
          </div>
          <div style="margin-top:8px;display:flex;gap:8px">
            <button class="btn btn-success btn-sm" onclick="window.open('/','_blank')">Abrir casas</button>
            <button class="btn btn-secondary btn-sm" onclick="navigator.clipboard.writeText(JSON.stringify(${JSON.stringify(s)}))">Copiar estratégia</button>
          </div>
        </div>
      `).join('');
    }

    calculateStakes(data) {
      const odd1 = parseFloat(data.odd1);
      const odd2 = parseFloat(data.odd2);
      let investment = parseFloat(data.totalInvestment) || 100;

      if (!odd1 || !odd2) {
        showToast('Preencha as odds', 'warning');
        return;
      }
      const margin = (1 / odd1) + (1 / odd2);
      if (margin >= 1) {
        showToast('Não há arbitragem com essas odds', 'warning');
        return;
      }
      const stake1 = (investment * (1 / odd1)) / margin;
      const stake2 = (investment * (1 / odd2)) / margin;
      const profit = (stake1 * odd1) - investment;
      const result = {
        stake1: stake1.toFixed(2),
        stake2: stake2.toFixed(2),
        profit: profit.toFixed(2),
        profitPercent: ((profit / investment) * 100).toFixed(2),
        investment: investment.toFixed(2)
      };

      const container = document.getElementById('calculator-results');
      if (container) {
        container.innerHTML = `
          <div class="card">
            <h4>Resultados</h4>
            <div>Casa 1: R$ ${result.stake1}</div>
            <div>Casa 2: R$ ${result.stake2}</div>
            <div>Investimento: R$ ${result.investment}</div>
            <div class="text-success">Lucro: R$ ${result.profit} (${result.profitPercent}%)</div>
          </div>
        `;
      }
    }

    startAutoUpdates() {
      setInterval(async () => {
        if (['dashboard','surebets'].includes(this.currentPage)) {
          await this.surebetService.fetchSurebets();
        }
      }, 30 * 1000); // a cada 30s
    }
  }

  // Inicializa app quando DOM pronto
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('app');
    if (!root) {
      const el = createEl('div', { id: 'app' });
      document.body.appendChild(el);
    }
    new App();
  });

})();
