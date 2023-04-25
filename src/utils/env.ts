
const DeviceAgents = [
	"Android", "iPhone",
	"SymbianOS", "Windows Phone",
	"iPad", "iPod"
];
export function isPc() {
	if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
	const userAgentInfo = navigator.userAgent;

	let flag = true;
	for (let v = 0; v < DeviceAgents.length; v++) {
		if (userAgentInfo.indexOf(DeviceAgents[v]) > 0) {
			flag = false;
			break;
		}
	}
	return flag;
}