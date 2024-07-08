import axios from 'axios';
import { load } from 'cheerio';

export const request = async (url: string) => {
  const { data } = await axios.get(url);
  return load(data);
};
