/**
 * Faz os ajustes iniciais para a assinatura
 *
 * @return {void}
 */
function initial() {
  // verifica se o navegador da suporte
  if (!('showNotification' in ServiceWorkerRegistration.prototype)) {
    console.log('Notificacoes nao suportadas');
    return;
  }

  if (Notification.permission === 'denied') {
    console.log('Notificação bloqueada pelo usuário');
    return;
  }

  if (!('PushManager' in window)) {
    console.log('PushNotification nao suportado');
    return;
  }

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.getSubscription().then(function(subscription) {
      // habilita mandar msg

      var pushButton = document.querySelector('.push-button');
      pushButton.disabled = false;

      if (!subscription) {
        // se nao esta assinando para o push, habilita o usuario se cadastrar
        return;
      }

      // salva
      saveSubscription(subscription);

      // habilita para cancelar
      pushButton.textContent = labelPushDisabled;
      isPushEnabled = true;
    }).catch(function(e) {
      console.log('erro na hora da assinatura' + e);
    });
  });
}

/*
 * Registra os eventos
 */
window.addEventListener('load', function() {
  var pushButton = document.querySelector('.push-button');

  // monitora o click
  pushButton.addEventListener('click', function() {
    if (isPushEnabled) {
      cancelar();
    } else{
      assinar();
    }
  });

  // verifica suporte do serviceWorker
  if ('serviceWorker' in navigator) {
    // adiciona serviço
    navigator.serviceWorker.register('./service-worker.js').then(initial());
  } else{
    console.log('Service Worker não é suportado');
  }
});
