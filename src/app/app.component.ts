import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { environment } from '../environments/environment';

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

  ngOnInit(): void {
    const account = this.msalService.instance.getActiveAccount();
    console.log('🧑 Cuenta activa:', account);

    if (!account) {
      console.warn('⚠️ No hay sesión activa, redirigiendo al login');
      this.router.navigate(['/login']);
      return;
    }

    // Check if this is a new registration by looking at the account info
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
    try {
      // Get token to check if user exists in our system
      const result = await this.msalService.acquireTokenSilent({
        scopes: [],
        account
      }).toPromise();

      console.log('✅ Access Token:', result?.accessToken);
      localStorage.setItem('token', result?.accessToken || '');

      // Check if user exists in our system by making a request
      // If user doesn't exist, redirect to complete-registration
      const userExists = await this.checkIfUserExists(account);
      
      if (!userExists) {
        console.log('🆕 Usuario nuevo detectado, redirigiendo a complete-registration');
        this.router.navigate(['/complete-registration'], {
          queryParams: {
            email: account.username || account.email,
            name: account.name || '',
            token: result?.accessToken || ''
          }
        });
      } else {
        console.log('✅ Usuario existente, redirigiendo al dashboard');
        this.router.navigate(['/dashboard']);
      }

    } catch (err) {
      console.error('❌ Error al obtener token de acceso:', err);
      // If there's an error, assume user needs to complete registration
      this.router.navigate(['/complete-registration'], {
        queryParams: {
          email: account.username || account.email,
          name: account.name || ''
        }
      });
    }
  }

  private async checkIfUserExists(account: any): Promise<boolean> {
    try {
      // Make a request to your backend to check if user exists
      // You'll need to implement this endpoint in your backend
      const response = await fetch(`${environment.apiUrl}/check-user-exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: account.username || account.email
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
