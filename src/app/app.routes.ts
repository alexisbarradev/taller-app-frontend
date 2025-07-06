import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './services/auth.guard';
import { CompleteRegistrationComponent } from './complete-registration/complete-registration.component';
import { UsersListComponent } from './users-list/users-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'complete-registration', component: CompleteRegistrationComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsersListComponent, canActivate: [authGuard] },
  { path: 'edit-user/:id', loadComponent: () => import('./edit-user/edit-user.component').then(m => m.EditUserComponent), canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
