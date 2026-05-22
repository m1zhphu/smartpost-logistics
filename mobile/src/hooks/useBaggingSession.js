import { useCallback, useReducer } from "react";

export const INITIAL_BAGGING_SESSION_STATE = {
  bagCode: "",
  estimatedCount: 0,
  scannedBills: [],
  expectedBills: [],
  status: "idle",
  isMismatch: false,
};

export const BAGGING_SESSION_ACTIONS = {
  INIT_BAG: "INIT_BAG",
  ADD_SCANNED_BILL: "ADD_SCANNED_BILL",
  SET_EXPECTED_BILLS: "SET_EXPECTED_BILLS",
  CHECK_MISMATCH: "CHECK_MISMATCH",
  RESET: "RESET",
};

const normalizeBillCode = (item) => {
  if (item === undefined || item === null) {
    return "";
  }

  if (typeof item === "string" || typeof item === "number") {
    return String(item).trim();
  }

  if (typeof item === "object") {
    return String(
      item.code ||
        item.waybill_code ||
        item.waybill ||
        item.waybillId ||
        item.tracking_number ||
        item.trackingNumber ||
        item.id ||
        "",
    ).trim();
  }

  return "";
};

const computeMismatch = (expectedBills, scannedBills) => {
  const expectedSet = new Set(
    (Array.isArray(expectedBills) ? expectedBills : [])
      .map(normalizeBillCode)
      .filter(Boolean),
  );

  const scannedSet = new Set(
    (Array.isArray(scannedBills) ? scannedBills : [])
      .map(normalizeBillCode)
      .filter(Boolean),
  );

  const missingFromScanned = [...expectedSet].filter(
    (item) => item && !scannedSet.has(item),
  );
  const extraScanned = [...scannedSet].filter(
    (item) => item && !expectedSet.has(item),
  );

  return missingFromScanned.length > 0 || extraScanned.length > 0;
};

const baggingSessionReducer = (state, action) => {
  switch (action.type) {
    case BAGGING_SESSION_ACTIONS.INIT_BAG: {
      const { bagCode = "", estimatedCount = 0 } = action.payload || {};
      return {
        ...state,
        bagCode,
        estimatedCount: Number(estimatedCount) || 0,
        scannedBills: [],
        expectedBills: [],
        status: "initialized",
        isMismatch: false,
      };
    }

    case BAGGING_SESSION_ACTIONS.ADD_SCANNED_BILL: {
      const billId = action.payload;
      if (!billId) {
        return state;
      }

      const normalizedBillId = normalizeBillCode(billId);
      if (!normalizedBillId) {
        return state;
      }

      if (state.scannedBills.includes(normalizedBillId)) {
        return state;
      }

      const scannedBills = [...state.scannedBills, normalizedBillId];
      return {
        ...state,
        scannedBills,
        status: "scanning",
        isMismatch: computeMismatch(state.expectedBills, scannedBills),
      };
    }

    case BAGGING_SESSION_ACTIONS.SET_EXPECTED_BILLS: {
      const expectedBills = Array.isArray(action.payload) ? action.payload : [];
      return {
        ...state,
        expectedBills,
        status: "expected_loaded",
        isMismatch: computeMismatch(expectedBills, state.scannedBills),
      };
    }

    case BAGGING_SESSION_ACTIONS.CHECK_MISMATCH: {
      return {
        ...state,
        isMismatch: computeMismatch(state.expectedBills, state.scannedBills),
        status: "checked",
      };
    }

    case BAGGING_SESSION_ACTIONS.RESET:
      return { ...INITIAL_BAGGING_SESSION_STATE };

    default:
      return state;
  }
};

export function useBaggingSession(
  initialState = INITIAL_BAGGING_SESSION_STATE,
) {
  const [sessionState, dispatch] = useReducer(
    baggingSessionReducer,
    initialState,
  );

  const initBag = useCallback((payload) => {
    dispatch({ type: BAGGING_SESSION_ACTIONS.INIT_BAG, payload });
  }, []);

  const addScannedBill = useCallback((billId) => {
    dispatch({
      type: BAGGING_SESSION_ACTIONS.ADD_SCANNED_BILL,
      payload: billId,
    });
  }, []);

  const setExpectedBills = useCallback((expectedBills) => {
    dispatch({
      type: BAGGING_SESSION_ACTIONS.SET_EXPECTED_BILLS,
      payload: expectedBills,
    });
  }, []);

  const checkMismatch = useCallback(() => {
    dispatch({ type: BAGGING_SESSION_ACTIONS.CHECK_MISMATCH });
  }, []);

  const resetSession = useCallback(() => {
    dispatch({ type: BAGGING_SESSION_ACTIONS.RESET });
  }, []);

  return {
    sessionState,
    dispatch,
    initBag,
    addScannedBill,
    setExpectedBills,
    checkMismatch,
    resetSession,
  };
}

export default useBaggingSession;
