/** localStorage can throw (private mode, blocked storage), so never let it break the page. */
export const readFlag = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

export const writeFlag = (key: string): void => {
  try {
    localStorage.setItem(key, "1");
  } catch {
    /* ignore, the flag just won't persist */
  }
};
