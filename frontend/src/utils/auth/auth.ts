import type { AuthResponse, LoginPayload, RegisterPayload } from "../../types/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE = `${API_BASE_URL}/api/auth`;

export const loginApi = async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await fetch(`${BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.non_field_errors?.[0] || "Invalid credentials");
    }
    return res.json();
};

export const registerApi = async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await fetch(`${BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const first = Object.values(err)?.[0];
        throw new Error(Array.isArray(first) ? first[0] : "Registration failed");
    }
    return res.json();
};

export const saveToken = (token: string) => localStorage.setItem("auth_token", token);
export const getToken = () => localStorage.getItem("auth_token");
export const clearToken = () => localStorage.removeItem("auth_token");