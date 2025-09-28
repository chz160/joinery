export const environment = {
  production: true,
  apiBaseUrl: 'https://api.joinery.com',
  oauth: {
    redirectUri: 'https://app.joinery.com/auth/callback',
    github: {
      clientId: 'your-github-client-id-prod', // Replace with actual GitHub OAuth app client ID for production
      scope: 'user:email read:user'
    }
  }
};