export function getEnvVariable(key: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        throw new Error(`Environment variable "${key}" is not set or is empty.`);
    }
    return value;
}

export function getEnvVariableOrDefault(key: string, defaultValue: string): string {
    const value = process.env[key];
    if (!value || value.trim() === '') {
        return defaultValue;
    }
    return value;
}