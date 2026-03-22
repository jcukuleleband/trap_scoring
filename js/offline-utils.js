/**
 * Offline-capable utility functions for loading squad data with localStorage fallback.
 * Ensures squad selection works even when internet is unavailable (T4-5.1.4.2).
 */

const SQUADS_CACHE_KEY = 'trap-squads-data';
const SQUADS_CACHE_TIMESTAMP_KEY = 'trap-squads-data-timestamp';

/**
 * Load squads from network with localStorage fallback for offline operation.
 * Implements T4-5.1.4.1: Squad metadata cached by service worker for offline operation.
 * Implements T4-5.1.4.2: Squad selection relies solely on cached or locally stored data when offline.
 *
 * @returns {Promise<Object>} Squads data object with { squads: [...] }
 */
async function loadSquadsWithOfflineFallback() {
  try {
    // Try to fetch from network first
    const response = await fetch('squads.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    
    // Cache successful fetch to localStorage with timestamp
    localStorage.setItem(SQUADS_CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(SQUADS_CACHE_TIMESTAMP_KEY, Date.now().toString());
    
    return data;
  } catch (fetchError) {
    // Network fetch failed - try localStorage fallback
    console.warn('Failed to fetch squads.json from network, using cached data:', fetchError);
    
    const cachedData = localStorage.getItem(SQUADS_CACHE_KEY);
    if (cachedData) {
      const timestamp = localStorage.getItem(SQUADS_CACHE_TIMESTAMP_KEY);
      const ageMs = Date.now() - parseInt(timestamp || '0');
      const ageHours = ageMs / (1000 * 60 * 60);
      
      // Implement T3-5.1.3: Warn if cached data is older than 1 day (24 hours)
      if (ageHours > 24) {
        console.warn(`Cached squad data is ${ageHours.toFixed(1)} hours old. Consider refreshing when connectivity is available.`);
      }
      
      return JSON.parse(cachedData);
    }
    
    // No cached data available
    throw new Error('Unable to load squads: No network connection and no cached data available.');
  }
}

/**
 * Get cached squads data timestamp.
 * Implements T3-5.1.3: System can detect when persistent data needs updating.
 *
 * @returns {number|null} Timestamp in milliseconds, or null if no cache
 */
function getSquadsCacheTimestamp() {
  const timestamp = localStorage.getItem(SQUADS_CACHE_TIMESTAMP_KEY);
  return timestamp ? parseInt(timestamp) : null;
}

/**
 * Get the age of cached squads data in hours.
 * @returns {number|null} Age in hours, or null if no cache
 */
function getSquadsCacheAgeHours() {
  const timestamp = getSquadsCacheTimestamp();
  if (!timestamp) return null;
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}
