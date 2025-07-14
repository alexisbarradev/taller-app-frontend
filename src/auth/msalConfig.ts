import { Configuration } from '@azure/msal-browser';
import { environment } from '../environments/environment'; // ← con 2 puntos, no 3
 // o '../environments/environment'

export const msalConfig: Configuration = {
  auth: {
    clientId: '22c2ec51-5266-40ca-81fe-b40be13e8a23',
    authority: 'https://proyectouc.b2clogin.com/proyectouc.onmicrosoft.com/B2C_1_UserCreated',
    redirectUri: environment.redirectUri,
    knownAuthorities: ['proyectouc.b2clogin.com'],
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

