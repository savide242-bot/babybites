/**
 * PWA Self-Heal Recovery Module
 * 
 * Detects chunk loading errors (common when SW caches are inconsistent)
 * and automatically clears caches + unregisters SW to recover.
 */

const RECOVERY_COOLDOWN_KEY = 'pwa_recovery_timestamp';
const RECOVERY_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

const CHUNK_ERROR_PATTERNS = [
  'Loading chunk',
  'Failed to fetch dynamically imported module',
  'Importing a module script failed',
  'ChunkLoadError',
  'Loading CSS chunk',
  'error loading dynamically imported module',
];

// Global guard: when true, PWA recovery will NOT unregister service workers
let _pushFlowActive = false;

export function setPushFlowActive(active: boolean): void {
  _pushFlowActive = active;
}

export function isPushFlowActive(): boolean {
  return _pushFlowActive;
}

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

function setCooldown(): void {
  try {
    sessionStorage.setItem(RECOVERY_COOLDOWN_KEY, Date.now().toString());
  } catch {
    // Ignore storage errors
  }
}

export async function performPWARecovery(): Promise<void> {
  // GUARD: Never nuke service workers while push subscription is in progress
  if (_pushFlowActive) {
    console.log('🔧 PWA Recovery: Push flow active, skipping SW cleanup');
    return;
  }

  console.log('🔧 PWA Recovery: Starting cache cleanup...');
  
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
    
    // Force reload from network
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
    
    performPWARecovery();
  }
}

export function initPWARecovery(): void {
  if (typeof window === 'undefined') return;
  
  console.log('🔧 PWA Recovery: Initializing error listeners');
  
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleError);
}

export function cleanupPWARecovery(): void {
  window.removeEventListener('error', handleError);
  window.removeEventListener('unhandledrejection', handleError);
}
