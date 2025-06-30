import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],   // <-- plural
})
export class LoginComponent {
  errorMessage: string | null = null;

  constructor(private router: Router) {}

  loginWithMicrosoft(): void {
    window.location.href =
    'https://3.135.134.201:8443/oauth2/authorization/B2C_1_DuocUCDemoAzure_Login';
  }
}
