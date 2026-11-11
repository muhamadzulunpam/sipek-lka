import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-layout">
      <!-- ===== SIDEBAR ===== -->
      <aside class="sidebar" [class.collapsed]="collapsed()">
        <div class="brand">
          <div class="brand-icon">📊</div>
          @if (!collapsed()) {
            <div class="brand-text">
              <strong>SIPEK-LKA</strong>
              <span>Pelaporan Kinerja</span>
            </div>
          }
        </div>

        <!-- NAVIGATION MENU -->
        @if (!auth.session()?.wajibGantiPassword) {
          <nav class="nav">
            <a class="nav-item" routerLink="/dashboard" routerLinkActive="active">
              <span class="nav-icon">🏠</span>
              @if (!collapsed()) { <span>Dashboard</span> }
            </a>
            <a class="nav-item" routerLink="/laporan" routerLinkActive="active">
              <span class="nav-icon">📝</span>
              @if (!collapsed()) { <span>Laporan</span> }
            </a>
            
            @if (auth.session()?.role === 'Pimpinan') {
              <a class="nav-item" routerLink="/pengguna" routerLinkActive="active">
                <span class="nav-icon">👥</span>
                @if (!collapsed()) { <span>Pengguna</span> }
              </a>
              <a class="nav-item" routerLink="/bidang" routerLinkActive="active">
                <span class="nav-icon">🏛️</span>
                @if (!collapsed()) { <span>Bidang</span> }
              </a>
              <a class="nav-item" routerLink="/audit" routerLinkActive="active">
                <span class="nav-icon">📜</span>
                @if (!collapsed()) { <span>Audit</span> }
              </a>
            }
          </nav>
        }

        <!-- FOOTER SIDEBAR -->
        <div class="sidebar-footer">
          @if (!auth.session()?.wajibGantiPassword) {
            <a class="nav-item pw-link" routerLink="/ganti-password" routerLinkActive="active">
              <span class="nav-icon">🔑</span>
              @if (!collapsed()) { <span>Ganti Password</span> }
            </a>
          }
          
          <button type="button" class="nav-item logout" (click)="auth.logout()">
            <span class="nav-icon">🚪</span>
            @if (!collapsed()) { <span>Keluar</span> }
          </button>
        </div>
      </aside>

      <!-- ===== MAIN ===== -->
      <div class="main">
        <!-- HEADER -->
        <header class="bar">
          <div class="bar-left">
            <button class="icon-btn" type="button" (click)="toggle()" aria-label="Toggle sidebar">
              ☰
            </button>
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" placeholder="Cari laporan, bidang, atau periode..." />
            </div>
          </div>

          <div class="bar-right">
            <button class="icon-btn with-dot" type="button" aria-label="Notifikasi">🔔</button>

            @if (auth.session(); as s) {
              <div class="user-card">
                <div class="avatar">
                  {{ s.namaLengkap.charAt(0).toUpperCase() }}
                </div>
                <div class="user-info">
                  <strong>{{ s.namaLengkap }}</strong>
                  <span>
                    {{ s.role === 'KepalaBidang' ? 'Kepala Bidang' : s.role }}
                    @if (s.namaBidang) { • {{ s.namaBidang }} }
                  </span>
                </div>
              </div>
            }
          </div>
        </header>

        <!-- CONTENT -->
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
      color: #0f172a;
    }

    /* ===== LAYOUT ===== */
    .app-layout {
      display: flex;
      min-height: 100vh;
      background: #f8fafc;
    }

    /* ===== SIDEBAR ===== */
    .sidebar {
      width: 260px;
      background: linear-gradient(160deg, #d6e9ff 0%, #8fc2ff 60%, #6baeff 100%);
      color: #ffffff;
      display: flex;
      flex-direction: column;
      padding: 24px 16px;
      position: sticky;
      top: 0;
      height: 100vh;
      border-radius: 0 24px 24px 0;
      box-shadow: 8px 0 30px rgba(74, 158, 255, 0.15);
      transition: width 0.3s ease, padding 0.3s ease;
      flex-shrink: 0;
      overflow: hidden;
    }
    .sidebar.collapsed {
      width: 88px;
      padding: 24px 12px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0 20px;
      margin-bottom: 20px;
      position: relative;
    }
    .brand::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 8px;
      right: 8px;
      height: 1px;
      background: rgba(255, 255, 255, 0.35);
    }

    .brand-icon {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.4);
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-size: 22px;
      backdrop-filter: blur(8px);
      flex-shrink: 0;
      margin: 0 auto;
    }
    .sidebar:not(.collapsed) .brand-icon {
      margin: 0;
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
      white-space: nowrap;
    }
    .brand-text strong {
      font-size: 15px;
      font-weight: 800;
      letter-spacing: -0.3px;
      color: #0d3363;
    }
    .brand-text span {
      font-size: 11px;
      font-weight: 600;
      color: rgba(13, 51, 99, 0.7);
    }

    /* ===== NAVIGATION ===== */
    .nav {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 700;
      color: #0d3363;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
      background: transparent;
      font-family: inherit;
      width: 100%;
      text-align: left;
      box-sizing: border-box;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 12px 0;
    }

    .nav-icon {
      font-size: 20px;
      min-width: 24px;
      text-align: center;
      flex-shrink: 0;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.45);
    }
    .nav-item.active {
      background: #ffffff;
      color: #2e82e6;
      box-shadow: 0 6px 18px rgba(74, 158, 255, 0.28);
    }

    /* ===== SIDEBAR FOOTER ===== */
    .sidebar-footer {
      position: relative;
      padding-top: 14px;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .sidebar-footer::before {
      content: '';
      position: absolute;
      top: 0;
      left: 8px;
      right: 8px;
      height: 1px;
      background: rgba(255, 255, 255, 0.35);
    }

    /* Link Ganti Password */
    .pw-link {
      color: #0d3363;
      font-size: 13px;
      font-weight: 600;
    }
    .pw-link:hover {
      background: rgba(255, 255, 255, 0.45);
    }
    .pw-link.active {
      background: #ffffff;
      color: #2e82e6;
      box-shadow: 0 6px 18px rgba(74, 158, 255, 0.28);
    }

    /* Tombol Logout */
    .logout {
      color: #b91c1c;
    }
    .logout:hover {
      background: rgba(255, 255, 255, 0.55);
    }

    /* ===== MAIN ===== */
    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* ===== HEADER ===== */
    .bar {
      height: 76px;
      background: #ffffff;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 28px;
      border-bottom: 1px solid #f1f5f9;
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(10px);
    }

    .bar-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 0;
    }
    .bar-right {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .icon-btn {
      width: 44px;
      height: 44px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      border-radius: 12px;
      font-size: 18px;
      display: grid;
      place-items: center;
      position: relative;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .icon-btn:hover {
      background: #eaf4ff;
      border-color: #b3d6ff;
    }
    .icon-btn.with-dot::after {
      content: '';
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      border: 2px solid #ffffff;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      padding: 10px 16px;
      border-radius: 999px;
      min-width: 280px;
      max-width: 460px;
      transition: all 0.2s ease;
    }
    .search-box:focus-within {
      border-color: #4a9eff;
      background: #ffffff;
      box-shadow: 0 0 0 4px rgba(74, 158, 255, 0.14);
    }
    .search-icon {
      font-size: 14px;
      opacity: 0.6;
    }
    .search-box input {
      border: none;
      background: transparent;
      outline: none;
      flex: 1;
      font-size: 14px;
      font-family: inherit;
      color: #0f172a;
    }
    .search-box input::placeholder {
      color: #94a3b8;
    }

    .user-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 14px 6px 6px;
      background: #f8fafc;
      border-radius: 999px;
      border: 1px solid #f1f5f9;
    }
    .avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6baeff 0%, #4a9eff 100%);
      color: #ffffff;
      font-weight: 800;
      font-size: 14px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
    }
    .user-info strong {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
    }
    .user-info span {
      font-size: 11px;
      color: #64748b;
      font-weight: 500;
    }

    /* ===== CONTENT ===== */
    .content {
      padding: 28px;
      flex: 1;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 900px) {
      .sidebar {
        position: fixed;
        z-index: 30;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
        border-radius: 0 24px 24px 0;
        width: 260px;
        padding: 24px 16px;
      }
      .sidebar:not(.collapsed) {
        transform: translateX(0);
      }
      .sidebar.collapsed {
        width: 260px;
        transform: translateX(-100%);
      }
      .search-box {
        display: none;
      }
      .user-info {
        display: none;
      }
      .content {
        padding: 16px;
      }
    }
  `],
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly collapsed = signal(false);

  toggle() {
    this.collapsed.update(v => !v);
  }
}