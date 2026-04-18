import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        map(response => {
          if (response && response.token) {
            const user: User = {
              id: response.id,
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
              token: response.token
            };
            this.storeUser(user);
          }
          return response;
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup`, userData)
      .pipe(
        map(response => {
          if (response && response.token) {
            const user: User = {
              id: response.id,
              email: response.email,
              firstName: response.firstName,
              lastName: response.lastName,
              token: response.token
            };
            this.storeUser(user);
          }
          return response;
        }),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  private storeUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token!);
    this.currentUserSubject.next(user);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  handleOAuth2Redirect(): void {
    // Cette méthode sera appelée après la redirection OAuth2
    this.http.get(`${this.apiUrl}/auth/user`).subscribe({
      next: (user: any) => {
        const userObj: User = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          token: user.token
        };
        this.storeUser(userObj);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('OAuth2 error:', error);
        this.router.navigate(['/login']);
      }
    });
  }
}