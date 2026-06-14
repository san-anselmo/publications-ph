'use strict';
(function () {
  window.onerror = function (msg, url, line, col, error) {
    const div = document.createElement('div');
    div.className = 'js-error-bar';

    // Safely structure error message text
    const cleanMsg = msg
      ? msg
          .toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      : 'Unknown error';
    const cleanUrl = url
      ? url
          .toString()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
      : 'Unknown file';

    div.innerHTML =
      '<strong>JavaScript Error:</strong> ' +
      cleanMsg +
      '<br><strong>File:</strong> ' +
      cleanUrl +
      '<br><strong>Line:</strong> ' +
      line +
      ':' +
      col;
    document.body.appendChild(div);
    return false;
  };

  window.addEventListener('unhandledrejection', function (e) {
    const reasonText = e.reason
      ? (e.reason.message || e.reason).toString()
      : 'Unknown promise rejection';

    // Ignore Pagefind errors in the UI error logger, since they are non-critical search index failures
    if (reasonText.toLowerCase().includes('pagefind')) {
      console.warn('Unhandled Pagefind rejection:', e.reason);
      return;
    }

    const div = document.createElement('div');
    div.className = 'js-rejection-bar';

    const cleanReason = reasonText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    div.innerHTML = '<strong>Unhandled Rejection:</strong> ' + cleanReason;
    document.body.appendChild(div);
  });
})();
