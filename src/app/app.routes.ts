import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './services/auth.guard';
import { ForoComponent } from './foro/foro.component';
import { CompleteRegistrationComponent } from './complete-registration/complete-registration.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'complete-registration', component: CompleteRegistrationComponent },
  { path: 'foro', component: ForoComponent, canActivate: [authGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
