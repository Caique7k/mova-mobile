import Constants from "expo-constants";
import { Platform } from "react-native";

const expoExtra = Constants.expoConfig?.extra as
  | { API_BASE_URL?: string }
  | undefined;

const envUrl = process.env.API_BASE_URL;
const extraUrl = expoExtra?.API_BASE_URL;

// URLs recomendadas por ambiente
const platformDefaultUrl =
  Platform.OS === "web"
    ? "http://localhost:4000"
    : Platform.OS === "android"
    ? "http://10.0.2.2:4000"
    : "http://127.0.0.1:4000";

// Em iPhone físico, use o IP da máquina (mesma rede) no .env.local, ex: 192.168.0.104
const fallbackUrl = "http://192.168.0.104:4000";

export const API_BASE_URL = envUrl || extraUrl || platformDefaultUrl || fallbackUrl;

if (!API_BASE_URL) {
  throw new Error(
    "API_BASE_URL não está configurado. Defina via .env.local ou app config"
  );
}