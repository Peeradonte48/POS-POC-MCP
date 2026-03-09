export interface SessionPayload {
  userId: string;
  role: "admin" | "manager" | "cashier";
  brandId: string;
  locationId: string;
  terminalId?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PinLoginRequest {
  pin: string;
  terminalId: string;
}
