import { useState } from "https://esm.sh/preact@10.11.3/hooks";

import { BGR15_to_CSS } from "../util/color.ts";
import { getInt, getShort } from "../util/data.ts";
import { upload } from "../util/fileIO.ts";

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

type FontTabProps = {
	enabled: boolean;
	palettes?: number[][];
	previewIdx?: number;
};

export default function FontTab(props: FontTabProps) {
	const [font, setFont] = useState<FontData | null>(null);
	const [text, setText] = useState("");

	async function importNFTR() {
		const file = await upload(".nftr");
		if (!file) return;
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

		setFont({width, height, bitdepth: depth, chars: charData});
	}

	const previewIdx = props.previewIdx !== undefined ? Math.max(props.previewIdx, 0) : 0;

	function drawGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, glyph: Uint8Array, glyphWidth: number, font: FontData) {
		let value = 0, bits = 0;
		let row = 0, col = 0;
		for (let byte of glyph) {
			for (let i = 0; i < 8; i++) {
				const top_bit = (byte & 0b10000000) >>> 7;
				value = (value << 1) + top_bit;
				if (++bits === font.bitdepth) {
					if (value && row < glyphWidth) {
						ctx.fillStyle = BGR15_to_CSS(props.palettes?.[previewIdx][value] ?? 0);
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
	

	function drawText(canvas: HTMLCanvasElement | null, font: FontData) {
		if (!canvas) return;
		const ctx = canvas.getContext("2d")!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let x = 0, y = 0;
		for (const char of text) {
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

	if (!props.enabled) return <></>;
	else return <>
		<h3>Preview Font</h3>
		<button onClick={importNFTR}>Load NFTR Font</button>
		{ font ? <>
			<p>Previewing palette #{previewIdx}</p>
			<textarea value={text} rows={9} onInput={e => setText(e.currentTarget.value)}/>
			<canvas style={{
				border: "var(--border-width) solid var(--form-element-border-color)"
			}} ref={canvas => drawText(canvas, font)}/>
		</> : null}
	</>;
}