import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, RouterOutlet } from '@angular/router';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="app-container">
      <mat-toolbar color="primary" class="main-toolbar">
        <button mat-icon-button (click)="toggleSidenav()" *ngIf="isLoggedIn">
          <mat-icon>menu</mat-icon>
        </button>
        
        <div class="logo-container">
          <span class="logo" routerLink="/dashboard" *ngIf="isLoggedIn">DriveApp</span>
          <span class="logo" routerLink="/login" *ngIf="!isLoggedIn">DriveApp</span>
        </div>
        
        <span class="spacer"></span>
        
        <ng-container *ngIf="isLoggedIn && currentUser">
          <div class="user-info">
            <mat-icon class="user-icon">person</mat-icon>
            <span class="user-name">{{currentUser.firstName}} {{currentUser.lastName}}</span>
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </ng-container>
      </mat-toolbar>

      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>

      <mat-drawer-container class="sidenav-container" *ngIf="isLoggedIn">
        <mat-drawer mode="side" [opened]="sidenavOpened">
          <mat-nav-list>
            <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
              <mat-icon>dashboard</mat-icon>
              <span>Dashboard</span>
            </a>
            
            <a mat-list-item (click)="openUploadDialog()">
              <mat-icon>cloud_upload</mat-icon>
              <span>Upload File</span>
            </a>
            
            <a mat-list-item routerLink="/dashboard" [queryParams]="{tab: 'my-files'}" routerLinkActive="active">
              <mat-icon>folder</mat-icon>
              <span>My Files</span>
            </a>
            
            <a mat-list-item routerLink="/dashboard" [queryParams]="{tab: 'public-files'}" routerLinkActive="active">
              <mat-icon>public</mat-icon>
              <span>Public Files</span>
            </a>
            
            <a mat-list-item routerLink="/dashboard" [queryParams]="{tab: 'requests'}" routerLinkActive="active">
              <mat-icon>notifications</mat-icon>
              <span>Access Requests</span>
              <mat-chip class="notification-chip" *ngIf="pendingRequestsCount > 0">
                {{pendingRequestsCount}}
              </mat-chip>
            </a>

            
            <a mat-list-item routerLink="/private-files" routerLinkActive="active">
              <mat-icon>lock</mat-icon>
              <span>Private Files</span>
            </a>
          </mat-nav-list>
        </mat-drawer>

        <mat-drawer-content>
          <div class="content-wrapper">
            <router-outlet></router-outlet>
          </div>
        </mat-drawer-content>
      </mat-drawer-container>

      <div *ngIf="!isLoggedIn">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .main-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
    }

    .logo-container {
      margin-left: 16px;
    }

    .logo {
      font-size: 24px;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      color: white;
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-icon {
      margin-right: 4px;
    }

    .user-name {
      font-size: 14px;
    }

    .sidenav-container {
      flex: 1;
    }

    mat-drawer {
      width: 250px;
      background: #fafafa;
    }

    .content-wrapper {
      padding: 20px;
      height: calc(100vh - 64px);
      overflow-y: auto;
    }

    mat-nav-list {
      padding-top: 0;
    }

    mat-nav-list a {
      border-left: 4px solid transparent;
    }

    mat-nav-list a.active {
      border-left-color: #3f51b5;
      background: rgba(63, 81, 181, 0.1);
    }

    .notification-chip {
      margin-left: 8px;
      font-size: 12px;
      height: 20px;
      min-height: 20px;
    }
  `]
})
export class AppComponent implements OnInit {
  sidenavOpened = true;
  isLoggedIn = false;
  currentUser: any = null;
  pendingRequestsCount = 0;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user;
    });
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  openUploadDialog(): void {
    // Implémentez l'ouverture du dialog d'upload ici
    console.log('Open upload dialog');
  }
}