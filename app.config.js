import fs from "fs";
import path from "path";

function parseEnvFile(filePath) {
  const result = {};
  if (!fs.existsSync(filePath)) return result;

  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

const envPath = path.resolve(__dirname, ".env.local");
const env = parseEnvFile(envPath);
const API_BASE_URL =
  env.API_BASE_URL || process.env.API_BASE_URL || "http://192.168.0.104:4000";

export default ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    API_BASE_URL,
  },
});
