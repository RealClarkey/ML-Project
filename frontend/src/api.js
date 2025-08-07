// src/api.js
import axios from "axios";
import { UserManager } from "oidc-client-ts"; // not strictly needed if you pass tokens manually
// (or just pull the token in components and set headers per request)

const api = axios.create({
  baseURL: "http://localhost:8000",
});

// Later: you can set Authorization from components when you have auth.user.access_token
export default api;