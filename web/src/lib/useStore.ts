import { useSyncExternalStore } from 'react'
import { store } from './store'

export function useAppState() {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState)
}

export function useSyncStatus() {
  return useSyncExternalStore(store.subscribe, store.getSync, store.getSync)
}
