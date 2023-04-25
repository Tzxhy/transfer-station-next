export function getHostname(str: string): string {
	if (!str) return '';
	const u = new URL(str)
	return u.hostname;
}

export function cacheData<T = any>(dataKey: string, value: T) {
	if (typeof window !== 'undefined') {
		window.localStorage.setItem(dataKey, JSON.stringify(value))
	}
	
}

export function getCacheData<T = any>(dataKey: string): T | null {
	if (typeof window !== 'undefined') {
		const s = (window.localStorage.getItem(dataKey) || '') as string;
		try {
			return JSON.parse(s);
		} catch (e) {
			return null;
		}
	}
	return null;
}