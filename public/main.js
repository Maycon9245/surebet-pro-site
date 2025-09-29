<<<<<<< HEAD
// main.js - front-end autônomo (ES module compatible)
(function () {
  'use strict';

  /* ===========================
     Helpers
     =========================== */
  function createEl(tag, attrs = {}, html = '') {
    const el = document.createElement(tag);
    for (const key in attrs) {
      if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
      if (key === 'class') el.className = attrs[key];
      else if (key.startsWith('data-')) el.setAttribute(key, attrs[key]);
      else el[key] = attrs[key];
    }
    if (html) el.innerHTML = html;
    return el;
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }
  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  /* ===========================
     Toaster
     =========================== */
  function showToast(message, type = 'info', duration = 3500) {
    const toast = createEl('div', { class: 'toast toast-' + type }, `<div>${message}</div>`);
    document.body.appendChild(toast);
    // small entrance
    toast.style.opacity = '1';
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, duration);
  }

  /* ===========================
     Modal
     =========================== */
  class Modal {
    constructor(id = 'modal', title = '') {
      this.id = id;
      this.title = title;
      this.overlay = null;
    }

    show(innerHtml) {
      this.hide();
      const overlay = createEl('div', { class: 'modal-overlay', id: this.id });
      const content = createEl('div', { class: 'modal-content' }, `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <h3 style="margin:0">${this.title}</h3>
          <button aria-label="fechar" id="${this.id}-close" style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text)">×</button>
        </div>
        <div id="${this.id}-body">${innerHtml}</div>
      `);
      overlay.appendChild(content);
      document.body.appendChild(overlay);
      const closeBtn = document.getElementById(`${this.id}-close`);
      if (closeBtn) closeBtn.addEventListener('click', () => this.hide());
      // close on overlay click (except content)
      overlay.addEventListener('click', (ev) => {
        if (ev.target === overlay) this.hide();
      });
      this.overlay = overlay;
    }

    hide() {
      const existing = document.getElementById(this.id);
      if (existing) existing.remove();
    }
  }

  /* ===========================
     Components (returns HTML strings)
     =========================== */
  function Header(user = null) {
    const userHtml = user
      ? `<div style="display:flex;gap:8px;align-items:center"><span style="font-size:14px">Olá, ${escapeHtml(user.email)}</span><button data-action="logout" class="btn btn-sm">Sair</button></div>`
      : `<button data-action="login" class="btn btn-primary">Entrar</button>`;

    return `
      <header>
        <div class="container" style="display:flex;align-items:center;justify-content:space-between">
          <div style="display:flex;align-items:center;gap:12px">
            <img src="logo.png" alt="logo" class="logo-topo" />
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

  function Dashboard() {
    return `
      <div class="container" style="padding-top:24px">
        <div class="grid" style="gap: 16px">
          <div class="card">
            <h2 class="font-heading">Bem-vindo ao SUREBET PRO</h2>
            <p style="color:var(--text-muted);margin-top:8px">Use o botão “Surebets” para carregar arbitragens em tempo real.</p>
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
      <div class="container" style="padding-top:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h2 class="font-heading">Surebets em tempo real</h2>
          <div style="display:flex;gap:8px">
            <button id="refreshSurebets" class="btn btn-secondary btn-sm">Atualizar</button>
            <button data-page="calculator" class="btn btn-sm">Calculadora</button>
          </div>
        </div>
        <div id="surebetsList" class="grid" style="gap:12px"></div>
      </div>
    `;
  }

  function Calculator() {
    return `
      <div class="container" style="padding-top:24px">
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
      <div class="container" style="padding-top:24px">
        <div class="card">
          <h3 class="font-heading">Histórico - últimas 100 execuções</h3>
          <div id="historyList" style="margin-top:12px">
            ${history.length ? history.map(h => `<div style="border-bottom:1px solid var(--border);padding:8px 0">
              <strong>${escapeHtml(h.homeTeam)} x ${escapeHtml(h.awayTeam)}</strong>
              <div style="font-size:13px;color:var(--text-muted)">Executado em: ${new Date(h.executedAt).toLocaleString()}</div>
            </div>`).join('') : '<div>Nenhum histórico.</div>'}
          </div>
        </div>
      </div>
    `;
  }

  /* ===========================
     Utilities
     =========================== */
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"'`]/g, function (m) {
      return ({ '&': '&amp;', '<': '<', '>': '>', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[m];
    });
  }

  /* ===========================
     Services
     =========================== */
  class AuthService {
    async login(email, password) {
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
        const res = await fetch('/api/surebets', { cache: 'no-store' });
        if (!res.ok) {
          console.warn('API /api/surebets retornou status', res.status);
          this.cache = [];
          return [];
        }
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

  /* ===========================
     App Controller
     =========================== */
  class App {
    constructor() {
      this.currentPage = 'dashboard';
      this.user = JSON.parse(localStorage.getItem('user') || 'null');
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
      const theme = localStorage.getItem('theme') || 'dark';
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
          e.preventDefault();
          const action = actionBtn.getAttribute('data-action');
          this.handleAction(action, actionBtn);
          return;
        }
      });

      document.addEventListener('submit', async (e) => {
        const form = e.target;
        const formType = form.getAttribute('data-form');
        if (!formType) return;
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        try {
          if (formType === 'login') await this.login(data);
          else if (formType === 'register') await this.register(data);
          else if (formType === 'calculator') this.calculateStakes(data);
        } catch (err) {
          showToast(err.message || 'Erro', 'error');
        }
      });
    }

    navigateTo(page) {
      this.currentPage = page;
      this.render();
      if (page === 'surebets') this.loadSurebetsToDOM();
    }

    async handleAction(action, el) {
      switch (action) {
        case 'login':
          this.showLoginModal();
          break;
        case 'logout':
          this.logout();
          break;
        default:
          console.log('Ação desconhecida', action);
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
          <form data-form="login" id="loginForm" style="display:grid;gap:8px">
            <input name="email" placeholder="Email" class="input" required />
            <input name="password" type="password" placeholder="Senha" class="input" required />
            <button class="btn btn-primary">Entrar</button>
          </form>

          <div style="text-align:center;margin:6px;color:var(--text-muted)">ou</div>

          <form data-form="register" id="registerForm" style="display:grid;gap:8px">
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
      if (!app) {
        console.error('Root #app não encontrado');
        return;
      }

      app.innerHTML = `
        ${Header(this.user)}
        <main>
          ${this.renderCurrentPage()}
        </main>
      `;

      setTimeout(() => this.afterRender(), 0);
    }

    renderCurrentPage() {
      switch (this.currentPage) {
        case 'dashboard': return Dashboard();
        case 'surebets': return SurebetsPage();
        case 'calculator': return Calculator();
        case 'history': return History();
        default: return Dashboard();
      }
    }

    afterRender() {
      const refreshBtn = qs('#refreshSurebets');
      if (refreshBtn) refreshBtn.addEventListener('click', () => this.loadSurebetsToDOM());
    }

    buildBookmakerUrl(bookmakerId, stake = 0) {
      if (!bookmakerId) return '';
      const map = {
        bet365: `https://www.bet365.com/#/AS/B${stake}/`,
        sportingbet: `https://www.sportingbet.com/pt-br/aposta-rapida?stake=${stake}`,
        betfair: `https://www.betfair.bet.br/apostas?stake=${stake}`,
        pinnacle: `https://www.pinnacle.com/pt/sports?stake=${stake}`,
        '1xbet': `https://1xbet.com/pt/live?amount=${stake}`,
        '22bet': `https://22bet.com/pt/live?stake=${stake}`,
        betway: `https://betway.com/sport?betamount=${stake}`
      };
      return map[bookmakerId] || `https://${bookmakerId}.com`;
    }

    saveToHistory(surebetData) {
      const history = JSON.parse(localStorage.getItem('surebetHistory') || '[]');
      history.unshift({
        ...surebetData,
        executedAt: new Date().toISOString(),
        id: Date.now()
      });
      localStorage.setItem('surebetHistory', JSON.stringify(history.slice(0, 100)));
    }

    async loadSurebetsToDOM() {
      const list = qs('#surebetsList');
      if (!list) return;
      list.innerHTML = `<div class="card">Carregando surebets...</div>`;

      const data = await this.surebetService.fetchSurebets();
      if (!Array.isArray(data) || data.length === 0) {
        list.innerHTML = `<div class="card">Nenhuma surebet encontrada no momento.</div>`;
        return;
      }

      list.innerHTML = data.map((s, idx) => {
        const safeHome = escapeHtml(s.homeTeam || s.home || 'Time A');
        const safeAway = escapeHtml(s.awayTeam || s.away || 'Time B');
        const sport = escapeHtml(s.sport || s.sport_title || '');
        const time = s.commenceTime ? new Date(s.commenceTime).toLocaleString('pt-BR') : '-';
        // Build URLs (fallback based on bookmaker id)
        const url1 = this.buildBookmakerUrl(s.bookmaker1?.id, s.stake1);
        const url2 = this.buildBookmakerUrl(s.bookmaker2?.id, s.stake2);
        const copyPayload = encodeURIComponent(JSON.stringify(s));
        const odd1 = s.bookmaker1?.odd ?? (s.bookmaker1 && s.bookmaker1.price) ?? '-';
        const odd2 = s.bookmaker2?.odd ?? (s.bookmaker2 && s.bookmaker2.price) ?? '-';
        return `
          <div class="card fade-in">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <strong>${safeHome} x ${safeAway}</strong>
                <div style="font-size:12px;color:var(--text-muted)">${sport} • ${time}</div>
              </div>
              <div style="text-align:right">
                <div>${escapeHtml(s.bookmaker1?.name || s.bookmaker1?.key || 'Casa 1')}: <strong>${escapeHtml(String(odd1))}</strong></div>
                <div>${escapeHtml(s.bookmaker2?.name || s.bookmaker2?.key || 'Casa 2')}: <strong>${escapeHtml(String(odd2))}</strong></div>
                <div style="margin-top:6px" class="badge badge-success">Lucro ${escapeHtml(String(s.profitPercentage || '0'))}%</div>
              </div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary btn-sm" data-open1="${escapeHtml(url1)}" data-open2="${escapeHtml(url2)}">Abrir casas</button>
              <button class="btn btn-secondary btn-sm" data-copy="${copyPayload}">Copiar estratégia</button>
            </div>
          </div>
        `;
      }).join('');

      // attach listeners to newly created buttons
      qsa('[data-open1]', list).forEach(btn => {
        btn.addEventListener('click', (e) => {
          const u1 = btn.getAttribute('data-open1');
          const u2 = btn.getAttribute('data-open2');
          if (u1) window.open(u1, '_blank', 'noopener');
          if (u2) window.open(u2, '_blank', 'noopener');
          showToast('Casas abertas com stakes pré-preenchidas!', 'success');
        });
      });

      qsa('[data-copy]', list).forEach(btn => {
        btn.addEventListener('click', (e) => {
          const dataEncoded = btn.getAttribute('data-copy') || '';
          try {
            const text = decodeURIComponent(dataEncoded);
            navigator.clipboard.writeText(text);
            showToast('Estratégia copiada!', 'success');
          } catch (err) {
            showToast('Erro ao copiar', 'error');
          }
        });
      });
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

      const container = qs('#calculator-results');
      if (container) {
        container.innerHTML = `
          <div class="card">
            <h4>Resultados</h4>
            <div>Casa 1: R$ ${result.stake1}</div>
            <div>Casa 2: R$ ${result.stake2}</div>
            <div>Investimento: R$ ${result.investment}</div>
            <div style="margin-top:8px;color:var(--success);font-weight:700">Lucro: R$ ${result.profit} (${result.profitPercent}%)</div>
            <div style="margin-top:10px">
              <button class="btn btn-secondary" id="copyCalcStrategy">📋 Copiar estratégia</button>
            </div>
          </div>
        `;

        const copyBtn = qs('#copyCalcStrategy');
        if (copyBtn) {
          copyBtn.addEventListener('click', () => {
            const text = `SUREBET CALCULADA\nCasa 1: R$ ${result.stake1}\nCasa 2: R$ ${result.stake2}\nInvestimento: R$ ${result.investment}\nLucro: R$ ${result.profit} (${result.profitPercent}%)`;
            navigator.clipboard.writeText(text).then(() => showToast('Estratégia copiada!', 'success')).catch(() => showToast('Erro ao copiar', 'error'));
          });
        }
      }
    }

    startAutoUpdates() {
      setInterval(() => {
        if (['dashboard', 'surebets'].includes(this.currentPage)) {
          this.surebetService.fetchSurebets();
          if (this.currentPage === 'surebets') this.loadSurebetsToDOM();
        }
      }, 30_000);
    }
  }

  // Initialize app when DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    if (!qs('#app')) {
      const el = createEl('div', { id: 'app' });
      document.body.appendChild(el);
    }
    try {
      new App();
    } catch (err) {
      console.error('Erro iniciando a aplicação:', err);
      showToast('Erro ao iniciar a aplicação. Veja console do navegador.', 'error');
    }
  });

})();
=======
import './style.css';
import { showToast } from './src/utils/toast.js';
import { Modal } from './src/components/Modal.js';
import { Header } from './src/components/Header.js';
import { Dashboard } from './src/pages/Dashboard.js';
import { Calculator } from './src/pages/Calculator.js';
import { Pricing } from './src/pages/Pricing.js';
import { Surebets } from './src/pages/Surebets.js';
import { Settings } from './src/pages/Settings.js';
import { History } from './src/pages/History.js';
import { AuthService } from './src/services/AuthService.js';
import { SurebetService } from './src/services/SurebetService.js';

class App {
  constructor() {
    this.currentPage = 'dashboard';
    this.user = null;
    this.authService = new AuthService();
    this.surebetService = new SurebetService();
    this.theme = localStorage.getItem('theme') || 'light';
    
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupEventListeners();
    this.checkAuth();
    this.render();
    this.startSurebetUpdates();
    this.applyFinalFixes();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.applyTheme();
    this.render();
  }

  setupEventListeners() {
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-page]')) {
        e.preventDefault();
        this.navigateTo(e.target.dataset.page);
      }

      if (e.target.matches('[data-action]')) {
        e.preventDefault();
        this.handleAction(e.target.dataset.action, e.target);
      }
    });

    document.addEventListener('submit', (e) => {
      if (e.target.matches('[data-form]')) {
        e.preventDefault();
        this.handleForm(e.target.dataset.form, e.target);
      }
    });
  }

  navigateTo(page) {
    this.currentPage = page;
    this.render();
  }

  async handleAction(action, element) {
    switch (action) {
      case 'theme-toggle':
        this.toggleTheme();
        break;
      case 'login':
        this.showLoginModal();
        break;
      case 'logout':
        this.logout();
        break;
      case 'open-bookmakers':
        this.openBookmakers(element);
        break;
      case 'copy-strategy':
        this.copyStrategy(element);
        break;
      default:
        console.log('Ação não reconhecida:', action);
    }
  }

  async handleForm(formType, form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    switch (formType) {
      case 'login':
        await this.login(data);
        break;
      case 'register':
        await this.register(data);
        break;
      case 'calculator':
        this.calculateStakes(data);
        break;
      default:
        console.log('Formulário não reconhecido:', formType);
    }
  }

  checkAuth() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    }
  }

  async login(data) {
    try {
      const user = await this.authService.login(data.email, data.password);
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      this.closeModals();
      showToast('Login realizado com sucesso!', 'success');
      this.render();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async register(data) {
    try {
      const user = await this.authService.register(data.email, data.password, data.name);
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      this.closeModals();
      showToast('Conta criada com sucesso!', 'success');
      this.render();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('user');
    showToast('Logout realizado com sucesso!', 'success');
    this.render();
  }

  showLoginModal() {
    const modal = new Modal('login-modal', 'Entrar na Conta');
    modal.show(`
      <div class="flex flex-col gap-4">
        <div class="flex gap-2">
          <button class="btn btn-primary flex-1" onclick="this.closest('.modal-content').querySelector('#login-form').style.display='block'; this.closest('.modal-content').querySelector('#register-form').style.display='none';">
            Login
          </button>
          <button class="btn btn-secondary flex-1" onclick="this.closest('.modal-content').querySelector('#register-form').style.display='block'; this.closest('.modal-content').querySelector('#login-form').style.display='none';">
            Cadastro
          </button>
        </div>

        <form id="login-form" data-form="login" class="flex flex-col gap-4">
          <input type="email" name="email" placeholder="E-mail" class="input" required>
          <input type="password" name="password" placeholder="Senha" class="input" required>
          <button type="submit" class="btn btn-primary">Entrar</button>
          <button type="button" class="btn-google" onclick="handleGoogleLogin()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color: #4285F4;">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar com Google
          </button>
        </form>

        <form id="register-form" data-form="register" class="flex flex-col gap-4" style="display: none;">
          <input type="text" name="name" placeholder="Nome completo" class="input" required>
          <input type="email" name="email" placeholder="E-mail" class="input" required>
          <input type="password" name="password" placeholder="Senha" class="input" required>
          <input type="password" name="confirmPassword" placeholder="Confirmar senha" class="input" required>
          <button type="submit" class="btn btn-primary">Criar conta</button>
        </form>
      </div>
    `);
  }

  closeModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => modal.remove());
  }

  openBookmakers(element) {
    const surebetData = JSON.parse(element.dataset.surebet);
    const { bookmaker1, bookmaker2, stake1, stake2 } = surebetData;

    try {
      const url1 = this.buildBookmakerUrl(bookmaker1.id, stake1);
      const url2 = this.buildBookmakerUrl(bookmaker2.id, stake2);

      const popup1 = window.open(url1, '_blank', 'noopener,noreferrer');
      const popup2 = window.open(url2, '_blank', 'noopener,noreferrer');

      if (!popup1 || !popup2) {
        showToast('Pop-ups bloqueados. Permita pop-ups e tente novamente.', 'warning');
      } else {
        showToast('Casas de apostas abertas com stakes pré-definidas!', 'success');
        this.saveToHistory(surebetData);
      }
    } catch (error) {
      showToast('Erro ao abrir casas de apostas', 'error');
    }
  }

  buildBookmakerUrl(bookmakerId, stake) {
    const bookmakers = {
      bet365: `https://www.bet365.com/#/AS/B${stake}/`,
      sportingbet: `https://www.sportingbet.com/pt-br/aposta-rapida?stake=${stake}`,
      betfair: `https://www.betfair.bet.br/apostas?stake=${stake}`,
      pinnacle: `https://www.pinnacle.com/pt/sports?stake=${stake}`,
      '1xbet': `https://1xbet.com/pt/live?amount=${stake}`,
      '22bet': `https://22bet.com/pt/live?stake=${stake}`,
      betway: `https://betway.com/sport?betamount=${stake}`
    };

    return bookmakers[bookmakerId] || `https://${bookmakerId}.com`;
  }

  copyStrategy(element) {
    const strategy = element.dataset.strategy;
    navigator.clipboard.writeText(strategy).then(() => {
      showToast('Estratégia copiada para a área de transferência!', 'success');
    }).catch(() => {
      showToast('Erro ao copiar estratégia', 'error');
    });
  }

  saveToHistory(surebetData) {
    const history = JSON.parse(localStorage.getItem('surebetHistory') || '[]');
    history.unshift({
      ...surebetData,
      executedAt: new Date().toISOString(),
      id: Date.now()
    });
    localStorage.setItem('surebetHistory', JSON.stringify(history.slice(0, 100)));
  }

  calculateStakes(data) {
    const { odd1, odd2, stake1, stake2, totalInvestment } = data;
    
    if (!odd1 || !odd2) {
      showToast('Preencha as odds para calcular', 'warning');
      return;
    }

    const margin = (1 / parseFloat(odd1)) + (1 / parseFloat(odd2));
    
    if (margin >= 1) {
      showToast('Não há arbitragem com essas odds', 'warning');
      return;
    }

    let calculatedStake1, calculatedStake2, investment;

    if (stake1 && !stake2) {
      calculatedStake1 = parseFloat(stake1);
      calculatedStake2 = (calculatedStake1 * parseFloat(odd1)) / parseFloat(odd2);
      investment = calculatedStake1 + calculatedStake2;
    } else if (stake2 && !stake1) {
      calculatedStake2 = parseFloat(stake2);
      calculatedStake1 = (calculatedStake2 * parseFloat(odd2)) / parseFloat(odd1);
      investment = calculatedStake1 + calculatedStake2;
    } else {
      investment = parseFloat(totalInvestment) || 100;
      calculatedStake1 = (investment * (1 / parseFloat(odd1))) / margin;
      calculatedStake2 = (investment * (1 / parseFloat(odd2))) / margin;
    }

    const profit = (calculatedStake1 * parseFloat(odd1)) - investment;
    const profitPercent = ((profit / investment) * 100);

    this.updateCalculatorResults({
      stake1: calculatedStake1.toFixed(2),
      stake2: calculatedStake2.toFixed(2),
      profit: profit.toFixed(2),
      profitPercent: profitPercent.toFixed(2),
      investment: investment.toFixed(2)
    });
  }

  updateCalculatorResults(results) {
    const container = document.getElementById('calculator-results');
    if (container) {
      container.innerHTML = `
        <div class="card">
          <h3 class="font-heading font-semibold mb-4">Resultados do Cálculo</h3>
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center">
              <div class="text-sm text-muted">Casa 1</div>
              <div class="text-xl font-semibold text-primary">R$ ${results.stake1}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-muted">Casa 2</div>
              <div class="text-xl font-semibold text-primary">R$ ${results.stake2}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-muted">Investimento Total</div>
              <div class="text-lg font-medium">R$ ${results.investment}</div>
            </div>
            <div class="text-center">
              <div class="text-sm text-muted">Lucro Garantido</div>
              <div class="text-lg font-medium text-success">R$ ${results.profit} (${results.profitPercent}%)</div>
            </div>
          </div>
          <button 
            class="btn btn-secondary w-full mt-4" 
            data-action="copy-strategy"
            data-strategy="💰 SUREBET CALCULADA

🏠 Casa 1: R$ ${results.stake1}
🏠 Casa 2: R$ ${results.stake2}
💵 Investimento: R$ ${results.investment}
✅ Lucro: R$ ${results.profit} (${results.profitPercent}%)

Gerado por SUREBET PRO"
          >
            📋 Copiar Estratégia
          </button>
        </div>
      `;
    }
  }

  startSurebetUpdates() {
    setInterval(() => {
      if (this.currentPage === 'surebets' || this.currentPage === 'dashboard') {
        this.surebetService.fetchSurebets();
      }
    }, 30000);
  }

  render() {
    const app = document.getElementById('app');
    
    app.innerHTML = `
      ${Header(this.user, this.theme)}
      <main class="min-h-screen pt-16">
        ${this.renderCurrentPage()}
      </main>
    `;
  }

  renderCurrentPage() {
    switch (this.currentPage) {
      case 'dashboard':
        return Dashboard(this.user);
      case 'surebets':
        return Surebets(this.user);
      case 'calculator':
        return Calculator();
      case 'pricing':
        return Pricing(this.user);
      case 'settings':
        return Settings(this.user);
      case 'history':
        return History();
      default:
        return Dashboard(this.user);
    }
  }

  // ============= CORREÇÕES FINAIS =============
  applyFinalFixes() {
    setTimeout(() => {
      // Corrige botões de login
      const loginButtons = document.querySelectorAll('[data-action="login"], button[onclick*="login"], a[href*="/login"], .login-btn');
      loginButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showLoginModal();
        });
      });

      // Corrige link "Registrar"
      const registerLinks = document.querySelectorAll('a[href*="register"], a:contains("Registrar"), a:contains("Escrivão"), a:contains("Cadastrar"), .register-link');
      registerLinks.forEach(link => {
        if (link.textContent.includes('Escrivão')) {
          link.textContent = link.textContent.replace('Escrivão', 'Registrar');
        }
        link.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showLoginModal();
          setTimeout(() => {
            const registerForm = document.querySelector('#register-form');
            const loginForm = document.querySelector('#login-form');
            if (registerForm && loginForm) {
              registerForm.style.display = 'block';
              loginForm.style.display = 'none';
            }
          }, 100);
        });
      });
    }, 1000);
  }
}

// Função global para o botão Google
window.handleGoogleLogin = () => {
  showToast('✅ Login com Google simulado com sucesso!', 'success');
};

// Inicializar aplicação
new App();
>>>>>>> 83575ba (Corrigir sistema com dados reais da Odds API)
