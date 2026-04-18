// src/app/components/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="title-icon">cloud</mat-icon>
            DriveApp Login
          </mat-card-title>
          <mat-card-subtitle>Secure file sharing platform</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="example@email.com">
              <mat-icon matPrefix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>
            
            <div class="button-container">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="!loginForm.valid || loading"
                class="full-width">
                <mat-icon>login</mat-icon>
                {{ loading ? 'Logging in...' : 'Login' }}
              </button>
              
              <div class="separator">
                <span>OR</span>
              </div>
              
              <button 
                mat-stroked-button 
                color="primary"
                type="button"
                (click)="loginWithGoogle()"
                [disabled]="loading"
                class="full-width google-btn">
                <img src="https://www.google.com/favicon.ico" alt="Google" class="google-icon">
                Sign in with Google
              </button>
            </div>
            
            <div class="register-link">
              Don't have an account? 
              <a routerLink="/register" class="link">Register here</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .login-card {
      width: 100%;
      max-width: 400px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    
    .title-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .button-container {
      margin: 24px 0;
    }
    
    .separator {
      display: flex;
      align-items: center;
      text-align: center;
      margin: 20px 0;
      color: #666;
      font-size: 14px;
    }
    
    .separator::before,
    .separator::after {
      content: '';
      flex: 1;
      border-bottom: 1px solid #ddd;
    }
    
    .separator span {
      padding: 0 10px;
    }
    
    .google-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .google-icon {
      width: 18px;
      height: 18px;
    }
    
    .register-link {
      text-align: center;
      margin-top: 24px;
      color: #666;
    }
    
    .link {
      color: #3f51b5;
      text-decoration: none;
      font-weight: 500;
      margin-left: 4px;
    }
    
    .link:hover {
      text-decoration: underline;
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Login failed. Please try again.';
          
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  loginWithGoogle(): void {
    this.loading = true;
    window.location.href = 'http://localhost:8080/api/oauth2/authorization/google';
  }
}