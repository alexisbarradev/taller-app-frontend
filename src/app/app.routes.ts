import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { authGuard } from './services/auth.guard';
import { CompleteRegistrationComponent } from './complete-registration/complete-registration.component';
import { UsersListComponent } from './users-list/users-list.component';
import { PublicarProductoComponent } from './publicar-producto/publicar-producto.component';
import { AllProductsComponent } from './all-products/all-products.component';
import { IntercambiosPanelComponent } from './intercambios-panel/intercambios-panel.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'complete-registration', component: CompleteRegistrationComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: 'usuarios', component: UsersListComponent },
      { path: 'publicar-producto', component: PublicarProductoComponent },
      { path: 'edit-user/:id', loadComponent: () => import('./edit-user/edit-user.component').then(m => m.EditUserComponent) },
      { path: 'mis-productos', loadComponent: () => import('./user-products/user-products.component').then(m => m.UserProductsComponent) },
      { path: 'producto/:id', loadComponent: () => import('./product-view/product-view.component').then(m => m.ProductViewComponent) },
      { path: 'todos-los-productos', component: AllProductsComponent },
      { path: 'intercambios', component: IntercambiosPanelComponent }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
