/**
 * Platform detection utilities for handling mobile PWA limitations
 */

/**
 * Detects if the current platform is iOS
 * @returns {boolean} True if running on iOS
 */
export function isIOS() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /iPad|iPhone|iPod/.test(navigator.platform) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detects if the current platform is Android mobile
 * @returns {boolean} True if running on Android mobile
 */
export function isAndroidMobile() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /Android/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);
}

/**
 * Detects if running on a mobile device (iOS or Android)
 * @returns {boolean} True if running on a mobile device
 */
export function isMobile() {
  return isIOS() || isAndroidMobile();
}

/**
 * Detects if the app is running as a PWA (standalone mode)
 * @returns {boolean} True if running as a PWA
 */
export function isPWA() {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Check matchMedia with fallback for test environments
  const matchMedia = window.matchMedia?.('(display-mode: standalone)').matches ?? false;
  const matchMediaFullscreen = window.matchMedia?.('(display-mode: fullscreen)').matches ?? false;
  const navigatorStandalone = window.navigator.standalone === true;
  
  return matchMedia || matchMediaFullscreen || navigatorStandalone;
}

/**
 * Detects if the File System Access API is fully supported
 * This checks for both the API existence and known platform limitations
 * @returns {object} Object with support details
 */
export function getFileSystemAccessSupport() {
  const hasAPI = typeof window !== 'undefined' && 
    typeof window.showDirectoryPicker === 'function';
  
  const ios = isIOS();
  const android = isAndroidMobile();
  const mobile = isMobile();
  const pwa = isPWA();
  
  // iOS never supports File System Access API
  // Android has partial support but with limitations in PWA mode
  const isSupported = hasAPI && !ios;
  const hasLimitations = mobile || pwa;
  
  return {
    hasAPI,
    isSupported,
    hasLimitations,
    isIOS: ios,
    isAndroid: android,
    isMobile: mobile,
    isPWA: pwa,
    // iOS users should never see folder picker option
    shouldShowFolderPicker: isSupported && !mobile,
    // Show warning on mobile even if API exists (Android)
    shouldShowWarning: hasLimitations && hasAPI,
  };
}

/**
 * Gets a user-friendly message explaining folder storage limitations
 * @returns {string|null} Message to display, or null if no warning needed
 */
export function getFolderStorageWarningMessage() {
  const support = getFileSystemAccessSupport();
  
  if (support.isIOS) {
    return 'Folder storage is not available on iOS. Your notes are stored securely in this browser.';
  }
  
  if (support.isAndroid && support.isPWA) {
    return 'Folder connections may disconnect when using the app in standalone mode. Consider using browser storage for better reliability.';
  }
  
  if (support.isMobile && support.isPWA) {
    return 'Folder connections may be less reliable in mobile PWA mode.';
  }
  
  return null;
}
