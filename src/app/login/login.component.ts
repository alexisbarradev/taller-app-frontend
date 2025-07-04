import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  errorMessage: string | null = null;

  constructor(
    private router: Router,
    private msalService: MsalService
  ) {}

  loginWithMicrosoft(): void {
    this.msalService.loginRedirect({
      scopes: []
    });
  }
}
