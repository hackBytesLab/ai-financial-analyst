declare module 'gotrue-js' {
  type GoTrueUser = {
    id?: string;
    email?: string;
    jwt?: (forceRefresh?: boolean) => Promise<string>;
    logout?: () => Promise<void>;
  };

  type GoTrueOptions = {
    APIUrl: string;
    audience?: string;
    setCookie?: boolean;
  };

  export default class GoTrue {
    constructor(options: GoTrueOptions);
    signup(email: string, password: string): Promise<unknown>;
    login(email: string, password: string, remember?: boolean): Promise<GoTrueUser>;
    currentUser(): GoTrueUser | null;
  }
}
