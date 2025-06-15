import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-password-recovery',
  standalone: true,
  templateUrl: './password-recovery.component.html',
  styleUrl: './password-recovery.component.css',
  imports: [CommonModule, ReactiveFormsModule],
})
export class PasswordRecoveryComponent {
  recoveryForm: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.recoveryForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  hasError(controlName: string): boolean {
    const control = this.recoveryForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  onSubmit(): void {
    if (this.recoveryForm.valid) {
      // TODO: Implement the actual password recovery logic with backend
      this.successMessage = 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña.';
      this.errorMessage = null;
    } else {
      this.recoveryForm.markAllAsTouched();
      this.errorMessage = 'Por favor, ingresa un correo electrónico válido.';
    }
  }

  goBack(): void {
    this.router.navigate(['/login']);
  }
} 