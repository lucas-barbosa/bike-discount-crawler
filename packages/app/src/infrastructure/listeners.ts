import { randomUUID } from 'crypto';
import { getByKey, saveByKey } from './redis';

const COLUMN_NAME = 'listeners';

export interface Listener {
  id: string
  url: string
  name: string
  authenticationKey?: string
};

export const addListener = async (name: string, url: string, authenticationKey?: string) => {
  const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  if (!urlPattern.test(url)) {
    console.warn('Invalid url!', url);
    return null;
  }

  const listeners = await getListeners();
  if (listeners.find(x => x.url === url)) {
    console.warn('Url already registred!');
    return listeners;
  }

  const id = randomUUID();
  listeners.push({
    id,
    name,
    url,
    authenticationKey
  });
  await saveListeners(listeners);
  return listeners;
};

export const deleteListener = async (id: string) => {
  const listeners = await getListeners();
  const modifiedListeners = listeners.filter(x => x.id !== id);
  if (listeners.length !== modifiedListeners.length) {
    await saveListeners(modifiedListeners);
  }
  return modifiedListeners;
};

export const updateListener = async (id: string, name?: string, url?: string, authenticationKey?: string) => {
  if (!name && !url && !authenticationKey) {
    return null;
  }

  const urlPattern = /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  if (url && !urlPattern.test(url)) {
    console.warn('Invalid url!', url);
    return null;
  }

  const listeners = await getListeners();
  if (url && listeners.find(x => x.url === url && x.id.toString() !== id)) {
    console.warn('Url already registred!');
    return listeners;
  }

  const modifiedListeners = listeners.map(x => x.id.toString() === id
    ? {
        id,
        name: name ?? x.name,
        url: url ?? x.url,
        authenticationKey: authenticationKey ?? x.authenticationKey ?? ''
      }
    : x);

  await saveListeners(modifiedListeners);
  return modifiedListeners;
};

export const getListeners = async () => {
  const result = await getByKey(COLUMN_NAME);
  if (result) return JSON.parse(result) as Listener[];
  return [];
};

export const saveListeners = async (listeners: Listener[]) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(listeners));
};
