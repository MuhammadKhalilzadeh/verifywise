import { createContext } from "react";

interface VerifyWiseContextProps {
  uiValues: any;
  setUiValues: (values: any) => void;
  authValues: any;
  setAuthValues: (values: any) => void;
  dashboardValues: any;
  setDashboardValues: (values: any) => void;
  inputValues: any;
  setInputValues: (values: any) => void;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const VerifyWiseContext = createContext<VerifyWiseContextProps>({
  uiValues: {},
  setUiValues: () => {},
  authValues: {},
  setAuthValues: () => {},
  dashboardValues: {},
  setDashboardValues: () => {},
  inputValues: {},
  setInputValues: () => {},
  token: null,
  login: () => {},
  logout: () => {},
});