import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export const useWindow = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
