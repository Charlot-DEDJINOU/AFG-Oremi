// Fonction pour convertir DD/MM/YYYY vers YYYY-MM-DD
export const convertDateToISO = (dateStr) => {
  if (!dateStr) return '';
  
  // Si la date est déjà au bon format, on la retourne
  if (dateStr.includes('-')) return dateStr;
  
  // Convertir DD/MM/YYYY vers YYYY-MM-DD
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return dateStr; // Retourner tel quel si format non reconnu
};