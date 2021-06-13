import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';

const issuer = `https://${process.env.AUTH0_TENANT}.auth0.com/`;

export const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${issuer}.well-known/jwks.json`
  }),

  audience: process.env.AUTH0_AUDIENCE,
  issuer: [issuer],
  algorithms: ['RS256']
});
