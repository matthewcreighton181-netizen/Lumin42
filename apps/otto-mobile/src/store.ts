// Everything the user types into Life and Business is kept on the phone only (AsyncStorage).
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await AsyncStorage.getItem("otto." + key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function save(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem("otto." + key, JSON.stringify(value));
  } catch {
    // Storage is a convenience; the app keeps working without it.
  }
}

export async function clearAll() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith("otto."));
    await AsyncStorage.multiRemove(keys);
  } catch {}
}
