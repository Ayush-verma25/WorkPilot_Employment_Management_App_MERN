const TOKEN_KEY = "workpilotToken";
const USER_KEY = "workpilotUser";

export const saveAuth = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getAuthUser = () => {
  const user = localStorage.getItem(USER_KEY);
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
