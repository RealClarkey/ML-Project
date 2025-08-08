import axios from "axios";
import { UserManager } from "oidc-client-ts"; // not strictly needed

const api = axios.create({ baseURL: "http://127.0.0.1:8000" });

// export a helper to set token when user logs in
export const setApiToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
