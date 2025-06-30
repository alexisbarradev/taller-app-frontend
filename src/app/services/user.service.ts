import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  
  constructor(private authService: AuthService) {}

  getUsername(): string {
    return this.authService.getUsername();
  }

  getRole(): string {
    return this.authService.getRole();
  }

  getUserInfo(): any {
    return this.authService.getUserInfo();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }
} 