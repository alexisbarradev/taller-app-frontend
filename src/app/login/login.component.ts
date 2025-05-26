import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // ✅ Importa Router
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  imports: [CommonModule, ReactiveFormsModule],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router // ✅ Inyecta Router
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const loginRequest = this.loginForm.value;
      this.authService.login(loginRequest).subscribe({
        next: (response: string) => {
          console.log('JWT:', response);
          localStorage.setItem('token', response);
          this.errorMessage = null;
          this.router.navigate(['/dashboard']); // ✅ Redirige al dashboard
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = 'Login failed. Please check your credentials.';
        },
      });
    } else {
      this.errorMessage = 'Please fill in all fields.';
    }
  }
}
