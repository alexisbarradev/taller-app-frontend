import { Configuration } from '@azure/msal-browser';

export const msalConfig: Configuration = {
  auth: {
    clientId: '22c2ec51-5266-40ca-81fe-b40be13e8a23',
    authority: 'https://proyectouc.b2clogin.com/proyectouc.onmicrosoft.com/B2C_1_UserCreated',
    redirectUri: 'http://localhost:4200',
    knownAuthorities: ['proyectouc.b2clogin.com'],
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};
