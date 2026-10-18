// Lager de eksisterende lokale id-ene for store-data.
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
