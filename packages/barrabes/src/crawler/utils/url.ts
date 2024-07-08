export const addPrefixIfRelative = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://www.barrabes.com${url}`;
};
