import React, { createContext, useReducer, useMemo, useContext } from "react";

const getStartOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const getEndOfToday = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

const initialState = {
  waybills: [],
  filters: {
    waybill_code: "",
    status: "",
    sla_status: "",
    cod_status: "",
    service_type: "",
    origin_hub_id: null,
    dest_hub_id: null,
    start_date: getStartOfToday(),
    end_date: getEndOfToday(),
    page: 1,
    size: 20,
  },
  isLoading: false,
};

const WaybillContext = createContext();

const actionTypes = {
  SET_WAYBILLS: "SET_WAYBILLS",
  ADD_WAYBILLS: "ADD_WAYBILLS",
  CLEAR_WAYBILLS: "CLEAR_WAYBILLS",
  SET_FILTERS: "SET_FILTERS",
  RESET_FILTERS: "RESET_FILTERS",
  SET_LOADING: "SET_LOADING",
};

const reducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_WAYBILLS:
      return {
        ...state,
        waybills: Array.isArray(action.payload) ? action.payload : [],
      };
    case actionTypes.ADD_WAYBILLS:
      return {
        ...state,
        waybills: [
          ...state.waybills,
          ...(Array.isArray(action.payload) ? action.payload : []),
        ],
      };
    case actionTypes.CLEAR_WAYBILLS:
      return {
        ...state,
        waybills: [],
      };
    case actionTypes.SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...(action.payload || {}),
        },
      };
    case actionTypes.RESET_FILTERS:
      return {
        ...state,
        filters: { ...initialState.filters },
      };
    case actionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: Boolean(action.payload),
      };
    default:
      return state;
  }
};

export const WaybillProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo(
    () => ({
      state,
      setWaybills: (items) =>
        dispatch({ type: actionTypes.SET_WAYBILLS, payload: items }),
      addWaybills: (items) =>
        dispatch({ type: actionTypes.ADD_WAYBILLS, payload: items }),
      clearWaybills: () => dispatch({ type: actionTypes.CLEAR_WAYBILLS }),
      setFilters: (filters) =>
        dispatch({ type: actionTypes.SET_FILTERS, payload: filters }),
      resetFilters: () => dispatch({ type: actionTypes.RESET_FILTERS }),
      setLoading: (isLoading) =>
        dispatch({ type: actionTypes.SET_LOADING, payload: isLoading }),
    }),
    [state],
  );

  return (
    <WaybillContext.Provider value={value}>{children}</WaybillContext.Provider>
  );
};

export const useWaybill = () => {
  const context = useContext(WaybillContext);
  if (!context) {
    throw new Error("useWaybill must be used within a WaybillProvider");
  }
  return context;
};
