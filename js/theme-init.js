'use strict';
(function () {
  const theme = localStorage.getItem('sap-theme');
  const isDark =
    theme === 'dark' ||
    (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
    if (document.body) {
      document.body.classList.add('dark');
    } else {
      const observer = new MutationObserver((mutations, obs) => {
        if (document.body) {
          document.body.classList.add('dark');
          obs.disconnect();
        }
      });
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    }
  }
})();
