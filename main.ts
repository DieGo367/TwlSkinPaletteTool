"use strict";

const fileInputElem = document.createElement("input");
fileInputElem.setAttribute("type", "file");
const aDownloadElem = document.createElement("a");

const colorInput = document.getElementById("colorIn") as HTMLInputElement;
const textInputBGR = document.getElementById("bgrIn") as HTMLInputElement;
const textInputRGB = document.getElementById("rgbIn") as HTMLInputElement;
const spanPalIdx = document.getElementById("palIdx")!;
const spanColorIdx = document.getElementById("colorIdx")!;
const btnModeSwitch = document.getElementById("modeSwitch")!;
const columnImageMode = document.getElementById("imageMode")!;
const columnFontMode = document.getElementById("fontMode")!;

const colors = [
	"#61829A", "#BA4900", "#FB0018", "#FB8AF8",
	"#FB9200", "#F3E300", "#AAFB00", "#00FB00",
	"#00A238", "#49DB8A", "#30BAF3", "#0059F3",
	"#000092", "#8A00D3", "#D300EB", "#FB0092"
];

const baseImage: number[][] = [];
const basePalette = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
let paletteName = "palette";
const palettes = [
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];
let editingColor = 0;
let fontMode = false;



function getInt(u8arr: Uint8Array, address: number) {
	return u8arr[address] | u8arr[address + 1] << 8 | u8arr[address + 2] << 16 | u8arr[address + 3] << 24;
}
function getShort(u8arr: Uint8Array, address: number) {
	return u8arr[address] | u8arr[address + 1] << 8;
}
function getShortBE(u8arr: Uint8Array, address: number) {
	return u8arr[address] << 8 | u8arr[address + 1];
}
function putShortBE(u8arr: Uint8Array, address: number, value: number) {
	u8arr[address] = value >>> 8 & 0xFF;
	u8arr[address + 1] = value & 0xFF;
}

function RGB_to_BGR15(r: number, g: number, b: number) {
	r = Math.floor(r / 255 * 31);
	g = Math.floor(g / 255 * 31);
	b = Math.floor(b / 255 * 31);
	return 1 << 15 | b << 10 | g << 5 | r;
}
function BGR15_to_RGB(bgr: number) {
	let r = bgr & 0b11111;
	let g = bgr >>> 5 & 0b11111;
	let b = bgr >>> 10 & 0b11111;
	return [Math.floor(r / 31 * 255), Math.floor(g / 31 * 255), Math.floor(b / 31 * 255)];
}
function BGR15_to_CSS(bgr: number) {
	const [r, g, b] = BGR15_to_RGB(bgr);
	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
function CSS_to_BGR15(color: string) {
	return RGB_to_BGR15(parseInt(color.substring(1, 3), 16), parseInt(color.substring(3, 5), 16), parseInt(color.substring(5, 7), 16));
}

function fileInput(accept: string, callback: (file: File) => void) {
	fileInputElem.accept = accept;
	fileInputElem.onchange = () => {
		let file = fileInputElem.files?.[0];
		if (file) callback(file);
		fileInputElem.value = "";
	};
	fileInputElem.click();
}


function importBaseImage() {
	fileInput("image/bmp,.grf", async file => {
		if (file.type === "image/bmp") {
			const buffer = await file.arrayBuffer();
			const data = new Uint8Array(buffer);

			// load bmp details
			const pixelDataOffset = getInt(data, 0x0A);
			const dibHeaderSize = getInt(data, 0x0E);
			const width = getInt(data, 0x12);
			const height = getInt(data, 0x16);
			const bpp = getShort(data, 0x1C);
			if (bpp !== 4) return alert("Base image must be 4bpp")
			const compressionType = getInt(data, 0x1E);
			const palColorCount = getInt(data, 0x2E) || 2**bpp;
			if (compressionType !== 0) return alert("Base image must not use compression");
			
			// load palette data
			const paletteData = data.slice(14 + dibHeaderSize, 14 + dibHeaderSize + 4 * palColorCount);
			for (let i = 0; i < 16; i++) {
				if (i < palColorCount) {
					basePalette[i] = RGB_to_BGR15(paletteData[i * 4 + 2], paletteData[i * 4 + 1], paletteData[i * 4]);
				}
				else basePalette[i] = 0;
			}

			// load pixel data
			const rowSize = Math.ceil(bpp * width / 32) * 4;
			const pixelData = data.slice(pixelDataOffset, pixelDataOffset + rowSize * height);
			baseImage.splice(0, baseImage.length);
			for (let row = 0; row < height; row++) {
				let pixelRow = [];
				for (let col = 0; col < width; col++) {
					let byte = pixelData[row * rowSize + Math.floor(col / 2)];
					pixelRow.push(col % 2 === 0 ? byte >>> 4 : byte & 0x0F);
				}
				baseImage.unshift(pixelRow);
			}
			
			paletteName = file.name.substring(0, file.name.length - 4);
			drawTo("base", baseImage, basePalette);
			updateBasePalette();
		}
		else if (file.name.endsWith(".grf")) {
			const buffer = await file.arrayBuffer();
			const data = new Uint8Array(buffer);
			
			const width = getInt(data, 0x1C);
			const height = getInt(data, 0x20);
			const pixelDataLen = (getInt(data, 0x2C) >>> 9) * 2;
			const palOffset = 0x30 + pixelDataLen + 0xC;
			const palLen = (getInt(data, palOffset - 4) >>> 9) * 2;
			
			const pixelData = data.slice(0x30, 0x30 + pixelDataLen);
			baseImage.splice(0, baseImage.length);
			const rowSize = width / 2;
			for (let row = 0; row < height; row++) {
				let pixelRow = [];
				for (let col = 0; col < width; col++) {
					let byte = pixelData[row * rowSize + Math.floor(col / 2)];
					pixelRow.push(col % 2 === 0 ? byte & 0x0F : byte >>> 4);
				}
				baseImage.push(pixelRow);
			}

			const paletteData = data.slice(palOffset, palOffset + palLen);
			for (let i = 0; i < 16; i++) {
				basePalette[i] = getShort(paletteData, i * 2);
			}

			paletteName = file.name.substring(0, file.name.length - 4);
			drawTo("base", baseImage, basePalette);
			updateBasePalette();
		}
		else alert("Base image should be a .bmp or .grf file");
	});
}

function importPalette() {
	fileInput(".bin", async file => {
		const buffer = await file.arrayBuffer();
		const data = new Uint8Array(buffer);
		const palColorCount = fontMode ? 4 : 16;
		for (let i = 0; i < 16; i++) {
			for (let j = 0; j < palColorCount; j++) {
				palettes[i][j] = getShortBE(data, (i * palColorCount + j) * 2);
			}
		}
		updatePaletteEditor();
	});
}
function exportPalette() {
	const palColorCount = fontMode ? 4 : 16;
	const data = new Uint8Array(palColorCount * 16 * 2);
	for (let i = 0; i < 16; i++) {
		for (let j = 0; j < palColorCount; j++) {
			putShortBE(data, (i * palColorCount + j) * 2, palettes[i][j]);
		}
	}
	const blob = new Blob([data]);
	const url = URL.createObjectURL(blob);
	aDownloadElem.setAttribute("href", url);
	aDownloadElem.setAttribute("download", paletteName + ".bin");
	aDownloadElem.click();
	URL.revokeObjectURL(url);
}

function drawTo(canvasID: string, pixels: number[][], palette: number[]) {
	if (pixels.length === 0) return;
	const canvas = document.getElementById(canvasID) as HTMLCanvasElement;
	canvas.style.width = "" + (canvas.width = pixels[0].length);
	canvas.style.height = "" + (canvas.height = pixels.length);
	const imgData = new ImageData(
		new Uint8ClampedArray(pixels.flat().reduce((arr: number[], palIdx) => {
			let color = palette[palIdx];
			arr.push(...BGR15_to_RGB(color), palIdx === 0 ? 0 : 255);
			return arr;
		}, [])),
		canvas.width,
		canvas.height
	);
	canvas.getContext("2d")?.putImageData(imgData, 0, 0);
}

function updatePaletteEditor() {
	for (let i = 0; i < 16; i++) {
		for (let j = 0; j < 16; j++) {
			const cell = document.getElementById(i + ',' + j) as HTMLTableCellElement;
			cell.style.backgroundColor = BGR15_to_CSS(palettes[i][j]);
		}
	}
}
function updateBasePalette() {
	for (let i = 0; i < 16; i++) {
		const cell = document.getElementById('base,' + i) as HTMLTableCellElement;
		cell.style.backgroundColor = BGR15_to_CSS(basePalette[i]);
	}
}

function setColorInputValues(bgr: number) {
	colorInput.value = BGR15_to_CSS(bgr);
	textInputBGR.value = bgr.toString(16).padStart(4, '0');
	textInputRGB.value = colorInput.value.substring(1, 7);
}

function selectColorCell(paletteNum: number, idx: number) {
	editingColor = paletteNum * 16 + idx;
	setColorInputValues(palettes[paletteNum][idx]);

	spanPalIdx.innerText = "" + paletteNum;
	spanColorIdx.innerText = "" + idx;
	document.getElementsByClassName("selected")[0].classList.remove("selected");
	document.getElementById(paletteNum + ',' + idx)?.classList.add("selected");
}

function setColorCell(paletteNum: number, idx: number, bgr: number) {
	palettes[paletteNum][idx] = bgr;
	document.getElementById(paletteNum + ',' + idx)!.style.backgroundColor = BGR15_to_CSS(bgr);
}

function copyBasePaletteToAll() {
	if (!confirm("Copy the base palette to all palettes in the set?")) return;
	for (let i = 0; i < palettes.length; i++) {
		palettes[i] = basePalette.slice(0, basePalette.length);
	}
	updatePaletteEditor();
}

function switchEditMode() {
	fontMode = !fontMode;
	if (fontMode) {
		btnModeSwitch.innerText = "Switch to Image Mode";
		columnFontMode.removeAttribute("hidden");
		columnImageMode.setAttribute("hidden", "hidden");
		for (let i = 0; i < 16; i++) {
			for (let j = 4; j < 16; j++) {
				const cell = document.getElementById(i + ',' + j) as HTMLTableCellElement;
				cell.style.display = "none";
			}
		}
	}
	else {
		btnModeSwitch.innerText = "Switch to Font Mode";
		columnImageMode.removeAttribute("hidden");
		columnFontMode.setAttribute("hidden", "hidden");
		for (let i = 0; i < 16; i++) {
			for (let j = 4; j < 16; j++) {
				const cell = document.getElementById(i + ',' + j) as HTMLTableCellElement;
				cell.style.display = "";
			}
		}
	}
}



updatePaletteEditor();
updateBasePalette();
colorInput.onchange = () => {
	let color = CSS_to_BGR15(colorInput.value);
	setColorCell(Math.floor(editingColor / 16), editingColor % 16, color);
	setColorInputValues(color);
};
textInputBGR.onchange = () => {
	let color = parseInt(textInputBGR.value, 16);
	if (isNaN(color)) color = 0;
	setColorCell(Math.floor(editingColor / 16), editingColor % 16, color);
	setColorInputValues(color);
};
textInputRGB.onchange = () => {
	let color = CSS_to_BGR15('#' + textInputRGB.value);
	setColorCell(Math.floor(editingColor / 16), editingColor % 16, color);
	setColorInputValues(color);
};
for (let i = 0; i < 16; i++) {
	for (let j = 0; j < 16; j++) {
		const cell = document.getElementById(i + ',' + j) as HTMLTableCellElement;
		cell.onclick = () => selectColorCell(i, j);
	}
	document.getElementById("pal" + i)!.onmouseenter = () => drawTo("base", baseImage, palettes[i]);
}
document.getElementById("palBase")!.onmouseenter = () => drawTo("base", baseImage, basePalette);