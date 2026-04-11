const ONBOARDING_STORAGE_KEY = 'plain-onboarding-complete';

export function hasCompletedOnboarding() {
  return window.localStorage.getItem(ONBOARDING_STORAGE_KEY) === 'true';
}

export function markOnboardingComplete() {
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
}

export function shouldShowOnboarding(library, isHydrated) {
  if (!isHydrated) return false;
  if (hasCompletedOnboarding()) return false;
  return true;
}
