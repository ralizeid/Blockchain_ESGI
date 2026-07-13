/**
 * fetch() n'a pas de timeout natif : sur une connexion qui stagne (réseau mobile,
 * proxy intermédiaire...), la promesse peut ne jamais se résoudre ni rejeter,
 * bloquant l'UI indéfiniment sans qu'aucune requête complète n'atteigne le serveur.
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('La requête a expiré (connexion trop lente ou instable). Merci de réessayer.');
    }
    throw e;
  } finally {
    clearTimeout(id);
  }
}
