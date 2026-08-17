import api from './client'

export function saveSubscription(subscription) {
  return api.post('/push-subscriptions', subscription)
}

export function removeSubscription(endpoint) {
  return api.delete('/push-subscriptions', { data: { endpoint } })
}
