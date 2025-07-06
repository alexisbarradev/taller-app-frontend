import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../environments/environment';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'mainfrontend';
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private msalService = inject(MsalService);
  private userService = inject(UserService);

  ngOnInit(): void {
    // Ensure active account is set
    const accounts = this.msalService.instance.getAllAccounts();
    if (accounts.length > 0) {
      this.msalService.instance.setActiveAccount(accounts[0]);
    }

    const account = this.msalService.instance.getActiveAccount();
    console.log('🧑 Cuenta activa:', account);

    if (account) {
      console.log('🔍 MSAL Account full object:', JSON.stringify(account, null, 2));
      if (!account.username) {
        console.warn('⚠️ MSAL account object does not have username.');
      } else {
        console.log('✅ Email to be used for registration:', account.username);
      }
    } else {
      console.warn('⚠️ No MSAL account found. Redirecting to login.');
      this.router.navigate(['/login']);
      return;
    }

    this.handlePostRegistrationFlow(account);

    this.route.queryParamMap.subscribe(params => {
      const token = params.get('token');
      if (token) {
        localStorage.setItem('token', token);
        this.router.navigate(['/dashboard']);
      }
    });
  }

  private async handlePostRegistrationFlow(account: any): Promise<void> {
    console.log('🔄 Iniciando flujo de post-registro para:', account.username);
    
    try {
      const result = await this.msalService.acquireTokenSilent({
        scopes: ['https://proyectouc.onmicrosoft.com/22c2ec51-5266-40ca-81fe-b40be13e8a23/demo.read'],
        account
      }).toPromise();

      if (!result?.accessToken) {
        console.error('❌ No se obtuvo accessToken.');
        return;
      }

      console.log('✅ Access Token obtenido exitosamente');
      localStorage.setItem('token', result.accessToken);

      const userExists = await this.checkIfUserExists(account);
      const emailToUse = account.username || 'no-email-found@example.com';

      if (!userExists) {
        console.log('🆕 Usuario nuevo detectado, redirigiendo a complete-registration');
        this.router.navigate(['/complete-registration'], {
          queryParams: {
            email: emailToUse,
            name: account.name || ''
          }
        });
        return; // Stop further processing!
      } else {
        console.log('✅ Usuario existente, redirigiendo al dashboard');
        this.router.navigate(['/dashboard']);
      }

      // Optionally, try to create/update user in backend asynchronously
      this.tryCreateUserInBackend(account);

    } catch (err) {
      console.error('❌ Error al obtener token de acceso:', err);
      const emailToUse = account.username || 'no-email-found@example.com';
      this.router.navigate(['/complete-registration'], {
        queryParams: {
          email: emailToUse,
          name: account.name || ''
        }
      });
    }
  }

  private async tryCreateUserInBackend(account: any): Promise<void> {
    try {
      const userExists = await this.checkIfUserExists(account);
      
      if (!userExists) {
        console.log('🆕 Usuario no existe en backend, creando...');
        // You can add logic here to automatically create the user in your backend
        // For now, we'll just log it
        console.log('Usuario necesita ser creado en el backend:', account.username);
      } else {
        console.log('✅ Usuario ya existe en backend');
      }

      // Get user role from backend
      if (account.username) {
        try {
          const rol = await this.userService.obtenerRolPorCorreo(account.username);
          console.log('🎭 Rol obtenido en app component:', rol);
        } catch (error) {
          console.error('❌ Error al obtener rol en app component:', error);
        }
      }
    } catch (error) {
      console.error('Error checking/creating user in backend:', error);
      // Don't redirect user, just log the error
    }
  }

  private async checkIfUserExists(account: any): Promise<boolean> {
    try {
      const response = await fetch(`${environment.apiUrl}/usuarios/correo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: account.username
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.exists || false;
      }

      return false;
    } catch (error) {
      console.error('Error checking if user exists:', error);
      return false;
    }
  }
}
