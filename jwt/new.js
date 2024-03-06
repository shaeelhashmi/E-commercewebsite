const jwt = require("jsonwebtoken");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IlNoYWVlbCIsImlhdCI6MTcwOTEzNDExNiwiZXhwIjoxNzA5MTM2NTE2fQ.gXEm0sSIAY9Wjrr5-_5w-UnqDDUbECp-ZacyTclP4oM";

// Split the token into parts
const [header, payload, signature] = token.split(".");

// Decode the header and payload
const decodedHeader = Buffer.from(header, "base64").toString("utf-8");
const decodedPayload = Buffer.from(payload, "base64").toString("utf-8");

console.log("Decoded Header:", JSON.parse(decodedHeader));
console.log("Decoded Payload:", JSON.parse(decodedPayload));

// Validate the signature (optional)
const isValid = jwt.verify(
  token,
  'j@hjtst5%$#%&&$@&^&%#%&#^%#*&&%#(()<?<"{{}":{}:{:_+)++)+$$',
  {
    algorithms: ["HS256"],
  }
);
console.log("Is Valid:", isValid);
