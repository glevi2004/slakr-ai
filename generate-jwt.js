const jwt = require('jsonwebtoken');
const fs = require('fs');

// Replace these with your actual Apple credentials
const teamId = '<YOUR_APPLE_TEAM_ID>';
const keyId = '<YOUR_APPLE_KEY_ID>';
const privateKeyPath = './AuthKey_<YOUR_APPLE_KEY_ID>.p8';

// The expiration time for the JWT (e.g., 6 months from now)
const expirationTime = Math.floor(Date.now() / 1000) + (180 * 24 * 60 * 60);

// Read the private key file
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

// The JWT payload
const payload = {
  iss: teamId,
  exp: expirationTime,
  aud: 'https://appleid.apple.com',
  sub: '<YOUR_APPLE_SERVICES_ID>',
};

// Generate the signed JWT
const token = jwt.sign(payload, privateKey, {
  algorithm: 'ES256',
  header: {
    alg: 'ES256',
    kid: keyId
  }
});

console.log('Generated JWT:');
console.log(token);r
