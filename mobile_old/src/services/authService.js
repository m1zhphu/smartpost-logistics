import { ENDPOINTS } from "../constants/data";
import { requestJson } from "./apiClient";

export const loginUser = async (username, password) => {
  console.log("Attempting to log in with username:", username);
  console.log("Attempting to log in with password:", password);
  console.log("Login endpoint:", ENDPOINTS.LOGIN);
  const data = await requestJson(
    ENDPOINTS.LOGIN,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    "Tài khoản hoặc mật khẩu không đúng.",
  );

  return { success: true, data };
};

export const registerUser = async (username, password) => {
  const data = await requestJson(
    ENDPOINTS.REGISTER,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    },
    "Đăng ký thất bại. Vui lòng thử lại.",
  );

  return { success: true, data };
};
