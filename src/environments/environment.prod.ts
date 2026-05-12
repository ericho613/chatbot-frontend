export const environment = {
  production: true,

  // The following should be used if you want the frontend and
  // backend to run in the same Docker container

  //   If you later put nginx or a reverse proxy in front of both frontend and backend apps, this might become:
  apiBaseUrl: '/api'

  // apiBaseUrl: 'http://localhost:8000'
  // apiBaseUrl: 'http://your-ec2-public-hostname-or-domain:8000'
};