import { getByKey, saveByKey } from './redis';

const COLUMN_NAME = 'listeners';

export interface Listener {
  id: number
  url: string
  name: string
};

export const getListeners = async () => {
  const result = await getByKey(COLUMN_NAME);
  if (result) return JSON.parse(result) as Listener[];
  return [];
};

export const saveListeners = async (listeners: Listener[]) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(listeners));
};
