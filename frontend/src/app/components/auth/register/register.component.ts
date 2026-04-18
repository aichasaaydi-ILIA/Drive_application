// src/app/components/auth/register/register.component.ts
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
  selector: 'app-register',
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
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon class="title-icon">person_add</mat-icon>
            Create Account
          </mat-card-title>
          <mat-card-subtitle>Join DriveApp today</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="name-fields">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName">
                <mat-icon matPrefix>person</mat-icon>
                @if (registerForm.get('firstName')?.hasError('required')) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName">
                @if (registerForm.get('lastName')?.hasError('required')) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="example@email.com">
              <mat-icon matPrefix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email')) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput formControlName="password" [type]="hidePassword ? 'password' : 'text'">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hidePassword = !hidePassword">
                <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength')) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirmPassword" [type]="hideConfirmPassword ? 'password' : 'text'">
              <mat-icon matPrefix>lock</mat-icon>
              <button mat-icon-button matSuffix type="button" (click)="hideConfirmPassword = !hideConfirmPassword">
                <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (registerForm.get('confirmPassword')?.hasError('required')) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (registerForm.hasError('passwordMismatch')) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>
            
            <div class="button-container">
              <button 
                mat-raised-button 
                color="primary" 
                type="submit"
                [disabled]="!registerForm.valid || loading"
                class="full-width">
                <mat-icon>person_add</mat-icon>
                {{ loading ? 'Creating account...' : 'Create Account' }}
              </button>
              
              <div class="separator">
                <span>OR</span>
              </div>
              
              <button 
                mat-stroked-button 
                color="primary"
                type="button"
                (click)="registerWithGoogle()"
                [disabled]="loading"
                class="full-width google-btn">
                <img src="https://www.google.com/favicon.ico" alt="Google" class="google-icon">
                Sign up with Google
              </button>
            </div>
            
            <div class="login-link">
              Already have an account? 
              <a routerLink="/login" class="link">Login here</a>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    
    .register-card {
      width: 100%;
      max-width: 500px;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    
    .title-icon {
      margin-right: 8px;
      vertical-align: middle;
    }
    
    .name-fields {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .half-width {
      flex: 1;
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
    
    .login-link {
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
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      
      const { confirmPassword, ...userData } = this.registerForm.value;
      
      this.authService.register(userData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.loading = false;
          let errorMessage = 'Registration failed. Please try again.';
          
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

  registerWithGoogle(): void {
    this.loading = true;
    window.location.href = 'http://localhost:8080/api/oauth2/authorization/google';
  }
}