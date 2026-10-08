// A document navigation skips React unmount. Await explicit shutdown for normal
// same-window links, and attempt cleanup for exits the browser does not let us wait on.
export function installAssistantDocumentExit({page, document, hasWork, stop, onFailure}) {
  let leaving = false;
  function click(event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey
        || event.shiftKey || event.altKey) return;
    const anchor = event.target?.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const destination = new URL(anchor.href, page.location.href);
    const current = new URL(page.location.href);
    if (!['http:', 'https:'].includes(destination.protocol)
        || (destination.origin === current.origin && destination.pathname === current.pathname
          && destination.search === current.search && destination.hash)) return;
    if (!hasWork()) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true;
    Promise.resolve().then(stop).then(() => page.location.assign(destination.href)).catch(() => {
      leaving = false;
      onFailure();
    });
  }
  function pagehide() {
    // Best effort only: tab/browser shutdown cannot await asynchronous SDK work.
    stop().catch(onFailure);
  }
  document.addEventListener('click', click);
  page.addEventListener('pagehide', pagehide);
  return () => {
    document.removeEventListener('click', click);
    page.removeEventListener('pagehide', pagehide);
  };
}
