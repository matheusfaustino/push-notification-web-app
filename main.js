'use strict';

/**
 * Usado para verificar se o push foi habilitado ou nao
 * @type {Boolean}
 */
var isPushEnabled = false;
/**
 * Label Button
 * @type {String}
 */
var labelPushEnabled = 'Habilitar Push';
var labelPushDisabled = 'Desabilitar push';

/**
 * Padroniza como pegar o subscriptionId entre as
 * versoes do chrome 42/43/44
 *
 * @param  {object} pushSubscription
 * @return {string}
 */
function endpointWorkaround(pushSubscription) {
  // Esta funcao lida com a remoção da SubscriptionId(Chrome 44) concatenando ela no endpoint da subscription
  // se nao for endpoint do GSM nao continua
  if (pushSubscription.endpoint.indexOf(config.gcm_endpoint) !== 0) {
    return pushSubscription.endpoint;
  }

  var mergedEndpoint = pushSubscription.endpoint;

  // chrome 42/43 nao terao o subscriptionId no endpoint
  if (pushSubscription.subscriptionId && pushSubscription.endpoint.indexOf(pushSubscription.subscriptionId) === -1) {
    mergedEndpoint = pushSubscription.endpoint + '/' + pushSubscription.subscriptionId;
  }

  return mergedEndpoint;
}

/**
 * Pega o endpoint do push e exibe o código curl
 * Futuramente será usada para salvar a subscription
 * para usar posteriormente no sistema
 *
 * @param  {string} subscription
 * @return {void}
 */
function saveSubscription(subscription) {
  console.log('Salvar definitivamente para usar mais tarde');

  var mergedEndpoint = endpointWorkaround(subscription);

  mostrarCodigoCURL(mergedEndpoint);
}

/**
 * Remove a subscription do servidor
 *
 * @param  {string} subscription
 * @return {void}
 */
function removeSubscription(subscription) {
  console.log('Remover do servidor a subscription');
}

/**
 * Monta command line para executar o push e imprime
 * na página
 *
 * @param  {string} mergedEndpoint
 * @return {void}
 */
function mostrarCodigoCURL(mergedEndpoint) {
  if (mergedEndpoint.indexOf(config.gcm_endpoint) !== 0) {
    console.log('O código nao suporta esse navegador');
  }

  var endpointSections = mergedEndpoint.split('/');
  var subscriptionId = endpointSections[endpointSections.length - 1];

  console.log(config);
  console.log(subscriptionId);

  var command = 'curl --header "Authorization: key=' + config.public_api +
                '" --header Content-Type:"application/json" ' + config.gcm_endpoint +
                 ' -d "{\\"registration_ids\\":[\\"' + subscriptionId + '\\"]}"';

  console.log(command);
  document.querySelector('.command-curl').textContent = command;
}

/**
 * Cancela a assinatura
 *
 * @return {void}
 */
function cancelar () {
  // pega elementos da página
  var pushButton = document.querySelector('.push-button');
  var curlDiv = document.querySelector('.command-curl');

  // reseta eles
  pushButton.disabled = true;
  curlDiv.textContent = '';

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    // precisamos pegar o objeto da assinatura para removermos
    serviceWorkerRegistration.pushManager.getSubscription().then(function(pushSubscription) {
      // se nao tem subscription apenas reseta e deixa o usuário fazer a assinatura
      if (!pushSubscription) {
        isPushEnabled = false;
        pushButton.disabled = false;
        pushButton.textContent = labelPushEnabled;
      }

      removeSubscription();

      // se tem assinatura, remove ela e habilita para refazer a assinatura
      pushSubscription.unsubscribe().then(function(successful) {
        isPushEnabled = false;
        pushButton.disabled = false;
        pushButton.textContent = labelPushEnabled;
      }).catch(function(e) {
        // deu algum erro e isso pode gerar um estado diferente.
        // entao só desabilita o push e informa o cliente
        console.log('Erro na unsubscription:' + e);
        pushButton.disabled = false;
      });

    }).catch(function(e) {
      console.log('Erro no serviço de registro do push' + e);
    });
  });
}

/**
 * Assina o navegador
 *
 * @return {string} subscription
 */
function assinar() {
  var pushButton = document.querySelector('.push-button');

  // previne o click enquanto processa
  pushButton.disabled = true;

  navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
    serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true}).then(function(subscription) {
      // assinado
      isPushEnabled = true;
      pushButton.textContent = labelPushDisabled;
      pushButton.disabled = false;

      return saveSubscription(subscription);
    }).catch(function(e) {
      if (Notification.permission == 'denied') {
        // usuario nao deixou o navegador assinar
        // agora terá que ser assinado manualmente
        console.log('Permissao negada :(');
        pushButton.disabled = true;
      } else {
        // pode cair aqui por falta de informação no manifest ou alguma chave errada
        console.log('Deu um erro na assinatura:' + e);
        pushButton.disabled = false;
        pushButton.textContent = labelPushEnabled;
      }
    });
  });
}
