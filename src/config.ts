import { FORCE_OFFLINE_KEY } from './constants/string';
import { getCacheData } from './utils/network';

const defaultIsOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false;

// eslint-disable-next-line import/no-anonymous-default-export
export default {
	/** 当前app是否处于离线模式 */
	nowUseOfflineMode: getCacheData<boolean>(FORCE_OFFLINE_KEY) || defaultIsOffline,
}
