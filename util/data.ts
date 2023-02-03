export function getInt(u8arr: Uint8Array, address: number) {
	return u8arr[address] | u8arr[address + 1] << 8 | u8arr[address + 2] << 16 | u8arr[address + 3] << 24;
}

export function getShort(u8arr: Uint8Array, address: number) {
	return u8arr[address] | u8arr[address + 1] << 8;
}

export function getShortBE(u8arr: Uint8Array, address: number) {
	return u8arr[address] << 8 | u8arr[address + 1];
}

export function putShortBE(u8arr: Uint8Array, address: number, value: number) {
	u8arr[address] = value >>> 8 & 0xFF;
	u8arr[address + 1] = value & 0xFF;
}