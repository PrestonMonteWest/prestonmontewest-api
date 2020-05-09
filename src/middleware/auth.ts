import jwt from 'express-jwt';
import jwks from 'jwks-rsa';

const issuer = `https://${process.env.AUTH0_TENANT}.auth0.com/`;

export const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${issuer}.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer,
  algorithms: ['RS256']
});
