export const EASE_SAAS = [0.16, 1, 0.3, 1] as const;

export const DURATIONS = {
  micro: 0.15,
  button: 0.2,
  dropdown: 0.22,
  modal: 0.26,
  page: 0.28,
} as const;

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: DURATIONS.page, ease: EASE_SAAS },
};

export const dropdownMotion = {
  initial: { opacity: 0, y: 6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 4, scale: 0.98 },
  transition: { duration: DURATIONS.dropdown, ease: EASE_SAAS },
};

export const modalBackdropMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATIONS.modal, ease: EASE_SAAS },
};

export const modalPanelMotion = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 6 },
  transition: { duration: DURATIONS.modal, ease: EASE_SAAS },
};

export const drawerPanelMotion = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: DURATIONS.modal, ease: EASE_SAAS },
};

export const tabSlideTransition = {
  type: 'tween' as const,
  duration: DURATIONS.dropdown,
  ease: EASE_SAAS,
};

export const staggerItem = (idx: number, duration: number = DURATIONS.dropdown) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: Math.min(idx * 0.035, 0.24), duration, ease: EASE_SAAS },
});
