(() => {
  const APP_VERSION = 'v5';
  const UPDATE_NOTICE_KEY = 'transfer-english-update-applied';
  let checking = false;

  function injectUpdateControl() {
    if (app.querySelector('[data-action="app-update"]')) return;
    const shell = app.querySelector('.shell');
    const hero = shell?.querySelector('.hero');
    if (!shell || !hero) return;

    const section = document.createElement('section');
    section.className = 'section app-update-section';
    section.innerHTML = `
      <div class="update-card">
        <div>
          <strong>앱 업데이트</strong>
          <p>새 버전이 있으면 바로 적용하고 다시 엽니다.</p>
        </div>
        <button class="button ghost update-button" data-action="app-update">업데이트</button>
      </div>`;
    hero.insertAdjacentElement('afterend', section);
  }

  const originalRenderHome = renderHome;
  renderHome = function renderHomeWithUpdateControl() {
    originalRenderHome();
    injectUpdateControl();
  };

  function waitForWorkerActivation(worker, timeoutMs = 12000) {
    if (!worker) return Promise.resolve(false);
    if (worker.state === 'activated') return Promise.resolve(true);
    if (worker.state === 'redundant') return Promise.resolve(false);

    return new Promise((resolve) => {
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        worker.removeEventListener('statechange', onStateChange);
        resolve(value);
      };
      const onStateChange = () => {
        if (worker.state === 'activated') finish(true);
        else if (worker.state === 'redundant') finish(false);
      };
      const timer = setTimeout(() => finish(false), timeoutMs);
      worker.addEventListener('statechange', onStateChange);
    });
  }

  function waitForUpdateWorker(registration, timeoutMs = 2500) {
    if (registration.waiting || registration.installing) {
      return Promise.resolve(registration.waiting || registration.installing);
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (worker) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        registration.removeEventListener('updatefound', onUpdateFound);
        resolve(worker || null);
      };
      const onUpdateFound = () => finish(registration.installing || registration.waiting);
      const timer = setTimeout(() => finish(null), timeoutMs);
      registration.addEventListener('updatefound', onUpdateFound);
    });
  }

  async function checkAndApplyUpdate(button) {
    if (checking) return;
    checking = true;

    const originalLabel = button.textContent;
    button.disabled = true;
    button.textContent = '확인 중…';

    if (!('serviceWorker' in navigator)) {
      showToast('이 환경에서는 앱 업데이트 기능을 사용할 수 없습니다.');
      button.disabled = false;
      button.textContent = originalLabel;
      checking = false;
      return;
    }

    let controllerChanged = false;
    const onControllerChange = () => {
      controllerChanged = true;
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    try {
      const registration = await navigator.serviceWorker.getRegistration() ||
        await navigator.serviceWorker.register('./sw.js');

      const updateWorkerPromise = waitForUpdateWorker(registration);
      await registration.update();

      const worker = registration.waiting || registration.installing || await updateWorkerPromise;
      if (!worker) {
        showToast(`현재 최신 버전입니다. (${APP_VERSION})`);
        return;
      }

      if (registration.waiting || worker.state === 'installed') {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }

      const activated = await waitForWorkerActivation(worker);
      if (activated || controllerChanged) {
        sessionStorage.setItem(UPDATE_NOTICE_KEY, '1');
        window.location.reload();
        return;
      }

      showToast('업데이트를 내려받았습니다. 앱을 다시 열면 적용됩니다.');
    } catch (error) {
      console.error('앱 업데이트 실패', error);
      showToast('업데이트를 확인하지 못했습니다. 인터넷 연결을 확인해 주세요.');
    } finally {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (document.contains(button)) {
        button.disabled = false;
        button.textContent = originalLabel;
      }
      checking = false;
    }
  }

  app.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="app-update"]');
    if (!button || button.disabled) return;
    event.stopImmediatePropagation();
    checkAndApplyUpdate(button);
  }, true);

  if (sessionStorage.getItem(UPDATE_NOTICE_KEY) === '1') {
    sessionStorage.removeItem(UPDATE_NOTICE_KEY);
    window.addEventListener('load', () => showToast('앱을 최신 버전으로 업데이트했습니다.'));
  }

  injectUpdateControl();

  window.APP_UPDATE = Object.freeze({
    version: APP_VERSION,
    checkAndApplyUpdate,
    injectUpdateControl
  });
})();
