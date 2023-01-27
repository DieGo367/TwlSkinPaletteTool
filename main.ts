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
const textInputFontPreview = document.getElementById("textIn") as HTMLInputElement;
const fontPreviewCanvas = document.getElementById("textPreview") as HTMLCanvasElement;
const pFontPreviewPalIdx = document.getElementById("fontPreviewPalIdx")!;
const pImagePreviewPalIdx = document.getElementById("imagePreviewPalIdx")!;
const selectRecolorPalette = document.getElementById("recolorPalSel") as HTMLInputElement;

const colors = [
	"#61829A", "#BA4900", "#FB0018", "#FB8AF8",
	"#FB9200", "#F3E300", "#AAFB00", "#00FB00",
	"#00A238", "#49DB8A", "#30BAF3", "#0059F3",
	"#000092", "#8A00D3", "#D300EB", "#FB0092"
];

type FontData = {
	width: number,
	height: number,
	bitdepth: number,
	chars: {
		[char: string]: {
			glyph: Uint8Array,
			leftSpace: number,
			width: number,
			advance: number
		}
	}
};

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
const font: FontData = {width: 0, height: 0, bitdepth: 2, chars: {}};
let fontPalIdx = 0;



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
			pImagePreviewPalIdx.removeAttribute("hidden");
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
			pImagePreviewPalIdx.removeAttribute("hidden");
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

function importNFTR() {
	fileInput(".nftr", async file => {
		const buffer = await file.arrayBuffer();
		const data = new Uint8Array(buffer);

		const infoOffset = getShort(data, 0x0C);
		const glyphsOffset = getInt(data, infoOffset + 0x10) - 8;
		const widthsOffset = getInt(data, infoOffset + 0x14) - 8;
		let charMapOffset = getInt(data, infoOffset + 0x18) - 8;

		const chunkSize = getInt(data, glyphsOffset + 0x04);
		const width = data[glyphsOffset + 0x08];
		const height = data[glyphsOffset + 0x09];
		const tileSize = getShort(data, glyphsOffset + 0x0A);
		const depth = data[glyphsOffset + 0x0E];
		const tileCount = Math.floor((chunkSize - 0x10) / tileSize);
		
		const tiles: Uint8Array[] = [];
		const spacings: Uint8Array[] = [];
		for (let i = 0; i < tileCount; i++) {
			tiles.push(data.slice(
				glyphsOffset + 0x10 + i * tileSize,
				glyphsOffset + 0x10 + (i + 1) * tileSize
			));
			spacings.push(data.slice(
				widthsOffset + 0x10 + i * 3,
				widthsOffset + 0x10 + (i + 1) * 3
			));
		}

		const charData: FontData["chars"] = {};
		while (charMapOffset > -8) {
			const startChar = getShort(data, charMapOffset + 0x08);
			const endChar = getShort(data, charMapOffset + 0x0A);
			const mapType = getInt(data, charMapOffset + 0x0C);
			const charCount = endChar - startChar + 1;

			if (mapType === 0) {
				const startTileIndex = getShort(data, charMapOffset + 0x14);
				for (let i = 0; i < charCount; i++) {
					const [leftSpace, width, advance] = spacings[startTileIndex + i];
					charData[String.fromCodePoint(startChar + i)] = {
						glyph: tiles[startTileIndex + i],
						leftSpace, width, advance
					};
				}
			}
			else if (mapType === 1) {
				for (let i = 0; i < charCount; i++) {
					const tileIndex = getShort(data, charMapOffset + 0x14 + i*2);
					if (tileIndex != 0xFFFF) {
						const [leftSpace, width, advance] = spacings[tileIndex];
						charData[String.fromCodePoint(startChar + i)] = {
							glyph: tiles[tileIndex],
							leftSpace, width, advance
						};
					}
				}
			}
			else if (mapType === 2) {
				const charCount = getShort(data, charMapOffset + 0x14);
				for (let i = 0; i < charCount; i++) {
					const char = getShort(data, charMapOffset + 0x16 + i*4);
					const tileIndex = getShort(data, charMapOffset + 0x18 + i*4);
					const [leftSpace, width, advance] = spacings[tileIndex];
					charData[String.fromCodePoint(char)] = {
						glyph: tiles[tileIndex],
						leftSpace, width, advance
					};
				}
			}

			charMapOffset = getInt(data, charMapOffset + 0x10) - 8;
		}

		font.width = width;
		font.height = height;
		font.bitdepth = depth;
		font.chars = charData;

		textInputFontPreview.removeAttribute("hidden");
		pFontPreviewPalIdx.removeAttribute("hidden");
		fontPreviewCanvas.removeAttribute("hidden");
		fontPreviewCanvas.width = fontPreviewCanvas.clientWidth;
		fontPreviewCanvas.height = fontPreviewCanvas.clientHeight;
		updateFontPreview();
	});
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

function generatePaletteViaRecolor() {
	if (baseImage.length === 0) return alert("Set a base image first.");
	fileInput("image/*", async file => {
		const url = URL.createObjectURL(file);
		const image = new Image();
		await new Promise(resolve => {
			image.onload = resolve;
			image.src = url;
		});
		URL.revokeObjectURL(url);

		if (image.height !== baseImage.length || image.width !== baseImage[0].length) {
			return alert(`Mismatch in image size! The base image is ${baseImage[0].length}x${baseImage.length}, but this image is ${image.width}x${image.height}.`);
		}
		
		const canvas = document.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;
		const ctx = canvas.getContext("2d", {willReadFrequently: true})!;
		ctx.drawImage(image, 0, 0);

		const baseImageFlat = baseImage.flat();
		const palNum = parseInt(selectRecolorPalette.value);
		for (let colorIdx = 0; colorIdx < 16; colorIdx++) {
			const pxIdx = baseImageFlat.indexOf(colorIdx);
			if (pxIdx !== -1) {
				const x = pxIdx % canvas.width;
				const y = Math.floor(pxIdx / canvas.width);
				const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
				palettes[palNum][colorIdx] = RGB_to_BGR15(r, g, b);
			}
			else palettes[palNum][colorIdx] = 0;
		}

		updatePaletteEditor();
	});
}

function drawGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, glyph: Uint8Array, glyphWidth: number, font: FontData) {
	let value = 0, bits = 0;
	let row = 0, col = 0;
	for (let byte of glyph) {
		for (let i = 0; i < 8; i++) {
			const top_bit = (byte & 0b10000000) >>> 7;
			value = (value << 1) + top_bit;
			if (++bits === font.bitdepth) {
				if (value && row < glyphWidth) {
					ctx.fillStyle = BGR15_to_CSS(palettes[fontPalIdx][value]);
					ctx.fillRect(x + row, y + col, 1, 1);
				}
				if (++row === font.width) {
					if (++col === font.height) return;
					row = 0;
				}
				value = 0;
				bits = 0;
			}
			byte = byte << 1; 
		}
	}
}

function updateFontPreview() {
	const str = textInputFontPreview.value;
	const ctx = fontPreviewCanvas.getContext("2d")!;
	ctx.clearRect(0, 0, fontPreviewCanvas.width, fontPreviewCanvas.height);
	let x = 0, y = 0;
	for (const char of str) {
		if (char in font.chars) {
			const {glyph, leftSpace, width, advance} = font.chars[char];
			drawGlyph(ctx, x + leftSpace, y, glyph, width, font);
			x += advance;
		}
		if (char === '\n') {
			x = 0;
			y += font.height;
		}
	}
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
	document.getElementById("pal" + i)!.onmouseenter = () => {
		if (fontMode) {
			fontPalIdx = i;
			updateFontPreview();
			pFontPreviewPalIdx.innerText = `Previewing palette #${i}`;
		}
		else {
			drawTo("base", baseImage, palettes[i]);
			pImagePreviewPalIdx.innerText = `Previewing palette #${i}`;
		}
	}
}
document.getElementById("palBase")!.onmouseenter = () => {
	drawTo("base", baseImage, basePalette);
	pImagePreviewPalIdx.innerText = "Viewing base image";
}