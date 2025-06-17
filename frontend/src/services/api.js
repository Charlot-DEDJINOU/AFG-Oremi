
import axios from "axios";
import { getData } from "./Helper";

const apiUrl = import.meta.env.VITE_API_URI_BASE;
axios.defaults.baseURL = apiUrl ;

axios.interceptors.request.use(
  async function (config) {
    /** Intercepter du token utilisateur et l'utiliser tant que disponible */
    if (!checkingFreeRoute(config.url)) {
      
    let token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzUyNzQ5MDMyLCJpYXQiOjE3NTAxNTcwMzIsImp0aSI6ImZkMDZkYjFlZWFhYTQzMzBhOGJlODQ3NmQ3MjZiNjFmIiwidXNlcl9pZCI6NTV9.bazjTs13clMeYynp7khrB_SGUf1dYYABBoQZDkhH5oM"

      if (typeof token === "string") {
        config.headers.Authorization = `Bearer ${token}`;
        config.headers["cache-control"] = `no-cache`;
      }
    }

    return config;
  },
  function (err) {
    console.log("Erreur", err);
  }
);

const checkingFreeRoute = (url) => {
  if (url.includes("noToken")) return true;
  return false;
};

/**
 *
 * @param {string} resource_url
 * @param {Array} filters
 * @param {number} limit
 */
export const getResource = (resource_url) => {
  
  return axios.get(resource_url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

/**
 *
 * @param {string} resource_url - Url for API
 * @param {object} data - Data
 * @param {object} headers
 */
export const postResource = (resource_url, data) => {
  return axios.post(resource_url, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    withCredentials: true,
    Authorization: ""
  });
};

export const postFile = (resource_url, data) => {
  return axios.post(resource_url, data, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};

/**
 *
 * @param {string} resource_url
 * @param {number} id
 * @param {object} data
 * @param {object} headers
 */
export const putResource = (resource_url, id, data) => {
  return axios.put(resource_url + "/" + id, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

export const patchResource = (resource_url, id, data) => {
  return axios.patch(resource_url + "/" + id, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

export const putResourceByUrl = (resource_url, data, headers) => {
  return axios.put(resource_url, data, headers);
};

/**
 *
 * @param {string} resource_url
 * @param {number} id
 */
export const removeResource = (resource_url, id) => {
  return axios.delete(resource_url + "/" + id);
};
