export const environment = {
  production: true,
  apiBaseUrl: 'https://dr2dbnqvs7.us-east-1.awsapprunner.com',
  oauth: {
    redirectUri: 'https://amkj3n4pw9.us-east-1.awsapprunner.com/auth/callback',
    github: {
      clientId: 'your-github-client-id-prod',
      scope: 'user:email read:user'
    }
  }
};