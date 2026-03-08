export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5256/api',
  oauth: {
    redirectUri: 'http://localhost:4200/auth/callback',
    github: {
      clientId: 'your-github-client-id', // Replace with actual GitHub OAuth app client ID
      scope: 'user:email read:user'
    }
  }
};