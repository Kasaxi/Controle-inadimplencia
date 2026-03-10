const STORAGE_KEY = "caixaflow-settings";

export interface AppSettings {
    criticalThreshold: number;
    alertThreshold: number;
    defaultResponsible: string;
    notifyOnCritical: boolean;
    notifyEmail: string;
    notifyWhatsApp: string;
    reminderDays: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
    criticalThreshold: 2,
    alertThreshold: 1,
    defaultResponsible: "",
    notifyOnCritical: false,
    notifyEmail: "",
    notifyWhatsApp: "",
    reminderDays: 30,
};

export function loadSettings(): AppSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { }
    return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
