export function RGB_to_BGR15(r: number, g: number, b: number) {
	r = Math.floor(r / 255 * 31);
	g = Math.floor(g / 255 * 31);
	b = Math.floor(b / 255 * 31);
	return 1 << 15 | b << 10 | g << 5 | r;
}

export function BGR15_to_RGB(bgr: number): [r: number, g: number, b: number] {
	let r = bgr & 0b11111;
	let g = bgr >>> 5 & 0b11111;
	let b = bgr >>> 10 & 0b11111;
	return [Math.floor(r / 31 * 255), Math.floor(g / 31 * 255), Math.floor(b / 31 * 255)];
}

export function BGR15_to_CSS(bgr: number) {
	const [r, g, b] = BGR15_to_RGB(bgr);
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function CSS_to_BGR15(color: string) {
	return RGB_to_BGR15(parseInt(color.substring(1, 3), 16), parseInt(color.substring(3, 5), 16), parseInt(color.substring(5, 7), 16));
}