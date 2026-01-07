/**
 * PWA Self-Heal Recovery Module
 * 
 * Detects chunk loading errors (common when SW caches are inconsistent)
 * and automatically clears caches + unregisters SW to recover.
 */

const RECOVERY_COOLDOWN_KEY = 'pwa_recovery_timestamp';
const RECOVERY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const RECOVERY_COUNT_KEY = 'pwa_recovery_count';
const MAX_RECOVERY_ATTEMPTS = 3;

const CHUNK_ERROR_PATTERNS = [
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'Loading CSS chunk',
  'error loading dynamically imported module',
  'Failed to fetch',
  'NetworkError',
  'Load failed',
  'Unexpected token',
  'is not valid JSON',
];

function isChunkLoadError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return CHUNK_ERROR_PATTERNS.some(pattern => 
    lowerMessage.includes(pattern.toLowerCase())
  );
}

function isInCooldown(): boolean {
  try {
    const lastRecovery = sessionStorage.getItem(RECOVERY_COOLDOWN_KEY);
    if (!lastRecovery) return false;
    
    const elapsed = Date.now() - parseInt(lastRecovery, 10);
    return elapsed < RECOVERY_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function getRecoveryCount(): number {
  try {
    return parseInt(sessionStorage.getItem(RECOVERY_COUNT_KEY) || '0', 10);
  } catch {
    return 0;
  }
}

function incrementRecoveryCount(): void {
  try {
    const count = getRecoveryCount() + 1;
    sessionStorage.setItem(RECOVERY_COUNT_KEY, count.toString());
  } catch {
    // Ignore storage errors
  }
}

function setCooldown(): void {
  try {
    sessionStorage.setItem(RECOVERY_COOLDOWN_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

export async function performPWARecovery(): Promise<void> {
  console.log('🔧 PWA Recovery: Starting cache cleanup...');
  
  // Check if we've exceeded max attempts
  if (getRecoveryCount() >= MAX_RECOVERY_ATTEMPTS) {
    console.log('🔧 PWA Recovery: Max attempts exceeded, not retrying');
    return;
  }
  
  incrementRecoveryCount();
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map(reg => {
          console.log('🔧 Unregistering SW:', reg.scope);
          return reg.unregister();
        })
      );
    }
    
    // Delete all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          console.log('🔧 Deleting cache:', name);
          return caches.delete(name);
        })
      );
    }
    
    console.log('🔧 PWA Recovery: Cleanup complete, reloading...');
    
    // Set cooldown before reload
    setCooldown();
    
    // Force reload from network (true = bypass cache)
    window.location.reload();
  } catch (error) {
    console.error('🔧 PWA Recovery failed:', error);
    // Still try to reload
    window.location.reload();
  }
}

function handleError(event: ErrorEvent | PromiseRejectionEvent): void {
  let message = '';
  
  if (event instanceof ErrorEvent) {
    message = event.message || '';
  } else if ('reason' in event) {
    const reason = event.reason;
    if (reason instanceof Error) {
      message = reason.message || '';
    } else if (typeof reason === 'string') {
      message = reason;
    }
  }
  
  if (isChunkLoadError(message)) {
    console.warn('🔧 PWA Recovery: Detected chunk load error:', message);
    
    if (isInCooldown()) {
      console.log('🔧 PWA Recovery: In cooldown, skipping auto-recovery');
      return;
    }
    
    if (getRecoveryCount() >= MAX_RECOVERY_ATTEMPTS) {
      console.log('🔧 PWA Recovery: Max attempts exceeded');
      return;
    }
    
    performPWARecovery();
  }
}

export function initPWARecovery(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 PWA Recovery: Initializing error listeners');
  
  // Reset recovery count on successful page load (after a delay)
  setTimeout(() => {
    try {
      sessionStorage.removeItem(RECOVERY_COUNT_KEY);
    } catch {
      // Ignore
    }
  }, 5000);
  
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleError);
}

export function cleanupPWARecovery(): void {
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleError);
}
