import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { provideHttpClient } from '@angular/common/http';

import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './auth/msalConfig';

export function MSALInstanceFactory() {
  return new PublicClientApplication(msalConfig);
}

async function main() {
  const msalInstance = MSALInstanceFactory();

  try {
    // ✅ Paso CRÍTICO para evitar el error "uninitialized_public_client_application"
    await msalInstance.initialize();

    const result = await msalInstance.handleRedirectPromise();

    if (result?.account) {
      msalInstance.setActiveAccount(result.account);
      console.log('✅ Cuenta activa desde redirect:', result.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0]);
        console.log('✅ Cuenta restaurada:', accounts[0]);
      } else {
        console.warn('⚠️ No hay cuenta activa aún.');
      }
    }

    const app = await bootstrapApplication(AppComponent, {
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        {
          provide: MSAL_INSTANCE,
          useValue: msalInstance,
        },
        MsalService,
      ],
    });

    // ✅ Conectar manualmente el servicio con la instancia
    const msalService = app.injector.get(MsalService);
    (msalService as any).msalInstance = msalInstance;

    console.log('✅ MSAL inicializado correctamente');
  } catch (err) {
    console.error('❌ Error durante inicialización MSAL:', err);
  }
}

main();
