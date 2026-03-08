export const environment = {
  production: true,
  apiBaseUrl: 'https://api.jnry.io',
  oauth: {
    redirectUri: 'https://app.jnry.io/auth/callback',
    github: {
      clientId: 'your-github-client-id-prod',
      scope: 'user:email read:user'
    }
  }
};