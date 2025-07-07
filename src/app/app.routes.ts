import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './services/auth.guard';
import { CompleteRegistrationComponent } from './complete-registration/complete-registration.component';
import { UsersListComponent } from './users-list/users-list.component';
import { PublicarProductoComponent } from './publicar-producto/publicar-producto.component';
// import { MisProductosComponent } from './mis-productos/mis-productos.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'complete-registration', component: CompleteRegistrationComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'usuarios', component: UsersListComponent, canActivate: [authGuard] },
  { path: 'publicar-producto', component: PublicarProductoComponent, canActivate: [authGuard] },
  // { path: 'mis-productos', component: MisProductosComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
