import { toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";

const NETWORK_ERROR_MESSAGE = "Network Error";
const TOKEN_ERROR_MESSAGES = ["Token expired or invalid", "Unauthorized"];
const REDIRECT_URL = import.meta.env.VITE_APP_URI_BASE;
const GENERAL_ERROR_MESSAGE = "Une erreur est intervenue lors de l'opération";
const AUTH_ERROR_MESSAGE = "Veuillez-vous connecter";

// Helper functions
const clearSessionAndRedirect = (message) => {
  console.warn(message); // Log the reason for logout
  localStorage.clear();
  window.location.href = REDIRECT_URL;
};

// Main error handling function
export const errorMessage = (error) => {
  if (!error || !error.response) {
    console.error("Unexpected error format:", error);
    onServerError("Une erreur inconnue s'est produite.");
    return;
  }

  const { status, data, message } = error.response;

  console.log("Error received:", error);

  if (message === NETWORK_ERROR_MESSAGE) {
    onServerWarning("Vérifiez votre connexion.");
  } else if (TOKEN_ERROR_MESSAGES.includes(data?.message)) {
    clearSessionAndRedirect(AUTH_ERROR_MESSAGE);
  } else if (status === 500) {
    onServerError(GENERAL_ERROR_MESSAGE);
  } else if (status === 422) {
    onServerError("Veuillez remplir tout les champs")
  } else if ([404, 403, 401, 400].includes(status)) {
    onServerError(data?.detail || "Une erreur s'est produite.");
  } else {
    console.warn("Unhandled error status:", status);
    onServerError("Une erreur inconnue s'est produite.");
  }
};

/** Fonction pour la déconnexion */
export const logout = () => {
  clearSessionAndRedirect("Déconnexion de l'utilisateur.");
};

/** Permet de stocker les infos utilisateurs sur le telephone en json*/
export const storeData = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    // saving error
  }
}

/** Permet de recuperer les infos utilisateurs sur le telephone*/
export const getData = (key) => {
  try {
    const value = localStorage.getItem(key)
    if (value !== null) {
      return value
    }

  } catch (e) {
    console.log(e)
  }
}

/** Permet de supprimer les infos utilisateurs sur le telephone*/
export const removeData = (key) => {
  try {
    const value = localStorage.removeItem(key)
  } catch (e) {
    console.log(e);
    // error reading value
  }
}

/**
 *  END PHONE DATA
 */


/**
 * 
 * ACCESS TOKEN  
 */

/** Permet de retrouver le token de l'utilisateur connecté */
export const getToken = async () => {
  const access_token = await getData("access_token")
  return access_token
}

/** Permet de retrouver le token de l'utilisateur connecté */
export const getRefreshToken = async () => {
  const refresh_token = await getData("refresh_token")
  //console.log("refresh_token");
  return refresh_token
}

/** SERVER ERROR */

export const onServerError = description => {
  toast.error(description, {
    position: "top-right",
    icon: "🚀",
    theme: "light"
  });
}

export const onServerSuccess = description => {
  toast.success(description, {
    position: "top-right",
    icon: "🚀",
    theme: "light"
  });

}

export const onServerWarning = description => {
  toast.warn(description, {
    position: "top-right",
    icon: "🚀",
    theme: "light"
  });
}