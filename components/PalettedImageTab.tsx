import { useState } from "https://esm.sh/preact@10.11.3/hooks";

import { PaletteCollection } from "./palette.tsx";

import { BGR15_to_RGB, RGB_to_BGR15 } from "../util/color.ts";
import { getInt, getShort } from "../util/data.ts";
import { upload } from "../util/fileIO.ts";

type PalettedImageData = {pixels: number[][], palette: number[]};

type PalettedImageTabProps = {
	enabled: boolean;
	palettes?: number[][];
	previewIdx?: number;
	onImport?: (filename: string) => void;
	onPaletteHover?: () => void;
	onCopyToAll?: (palette: number[]) => void;
	onRecolorImport?: (idx: number, palette: number[]) => void;
};

export default function PalletedImageTab(props: PalettedImageTabProps) {
	const [image, setImage] = useState<PalettedImageData | null>(null);
	const [targetPaletteIdx, setTargetPaletteIdx] = useState(0);

	async function importPalettedImage() {
		const file = await upload("image/bmp,.grf");
		if (file?.type === "image/bmp") {
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
			const palette = Array<number>(16).fill(0);
			const paletteData = data.slice(14 + dibHeaderSize, 14 + dibHeaderSize + 4 * palColorCount);
			for (let i = 0; i < palette.length && i < palColorCount; i++) {
				palette[i] = RGB_to_BGR15(paletteData[i * 4 + 2], paletteData[i * 4 + 1], paletteData[i * 4]);
			}

			// load pixel data
			const rowSize = Math.ceil(bpp * width / 32) * 4;
			const pixelData = data.slice(pixelDataOffset, pixelDataOffset + rowSize * height);
			const pixels: number[][] = [];
			for (let row = 0; row < height; row++) {
				const pixelRow: number[] = [];
				for (let col = 0; col < width; col++) {
					let byte = pixelData[row * rowSize + Math.floor(col / 2)];
					pixelRow.push(col % 2 === 0 ? byte >>> 4 : byte & 0x0F);
				}
				pixels.unshift(pixelRow);
			}

			setImage({pixels, palette});
			props.onImport?.(file.name);
		}
		else if (file?.name.endsWith(".grf")) {
			const buffer = await file.arrayBuffer();
			const data = new Uint8Array(buffer);
			
			const width = getInt(data, 0x1C);
			const height = getInt(data, 0x20);
			const pixelDataLen = (getInt(data, 0x2C) >>> 9) * 2;
			const palOffset = 0x30 + pixelDataLen + 0xC;
			const palLen = (getInt(data, palOffset - 4) >>> 9) * 2;
			
			const pixelData = data.slice(0x30, 0x30 + pixelDataLen);
			const pixels: number[][] = [];
			const rowSize = width / 2;
			for (let row = 0; row < height; row++) {
				const pixelRow: number[] = [];
				for (let col = 0; col < width; col++) {
					let byte = pixelData[row * rowSize + Math.floor(col / 2)];
					pixelRow.push(col % 2 === 0 ? byte & 0x0F : byte >>> 4);
				}
				pixels.push(pixelRow);
			}

			const paletteData = data.slice(palOffset, palOffset + palLen);
			const palette = Array<number>(16).fill(0);
			for (let i = 0; i < palette.length; i++) {
				palette[i] = getShort(paletteData, i * 2);
			}

			setImage({pixels, palette});
			props.onImport?.(file.name);
		}
		else if (file) alert("Base image should be a .bmp or .grf file");
	}

	function drawImage(canvas: HTMLCanvasElement | null, pixels: number[][], palette: number[]) {
		if (!canvas) return;
		const imageData = new ImageData(
			new Uint8ClampedArray(pixels.flat().reduce((arr: number[], value) => {
				const color = palette[value];
				arr.push(...BGR15_to_RGB(color), value === 0 ? 0 : 255);
				return arr;
			}, [])),
			pixels[0].length,
			pixels.length
		);
		canvas.getContext("2d")?.putImageData(imageData, 0, 0);
	}

	function copyPaletteToAll(palette: number[]) {
		if (!confirm("Copy the base palette to all palettes in the set?")) return;
		props.onCopyToAll?.(palette.slice());
	}

	async function importRecoloredImage(basePixels: number[][]) {
		const file = await upload("image/*");
		if (!file) return;
		const url = URL.createObjectURL(file);
		const image = new Image();
		await new Promise(resolve => {
			image.onload = resolve;
			image.src = url;
		});
		URL.revokeObjectURL(url);

		if (image.height !== basePixels.length || image.width !== basePixels[0].length) {
			return alert(`Mismatch in image size! The base image is ${basePixels[0].length}x${basePixels.length}, but this image is ${image.width}x${image.height}.`);
		}

		const canvas = document.createElement("canvas");
		canvas.width = image.width;
		canvas.height = image.height;
		const ctx = canvas.getContext("2d", {willReadFrequently: true})!;
		ctx.drawImage(image, 0, 0);

		const baseFlat = basePixels.flat();
		const palette: number[] = [];
		for (let value = 0; value < 16; value++) {
			const pixelIdx = baseFlat.indexOf(value);
			if (pixelIdx !== -1) {
				const x = pixelIdx % canvas.width;
				const y = Math.floor(pixelIdx / canvas.width);
				const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
				palette.push(RGB_to_BGR15(r, g, b));
			}
			else palette.push(0);
		}

		props.onRecolorImport?.(targetPaletteIdx, palette);
	}

	const previewIdx = props.previewIdx ?? 0;

	if (!props.enabled) return <></>;
	else return <>
		<h3>Base Image</h3>
		<button onClick={importPalettedImage}>Set Base Image</button>
		{ image ? <>
			<p>{previewIdx === -1 ? "Viewing base image" : `Previewing palette #${previewIdx}`}</p>
			<canvas
				width={image.pixels[0].length}
				height={image.pixels.length}
				ref={canvas => drawImage(canvas, image.pixels, previewIdx === -1 ? image.palette : props.palettes?.[previewIdx] ?? [])}
			/>
			<h4>Base Palette</h4>
			<PaletteCollection palettes={[image.palette]} onPaletteHover={props.onPaletteHover}/>
			<section/>
			<button onClick={() => copyPaletteToAll(image.palette)}>Copy to All</button>
			<h4>Set Palette via Recolored Image</h4>
			<div class="grid">
				<select value={targetPaletteIdx} onChange={e => setTargetPaletteIdx(parseInt(e.currentTarget.value))}>
					<option value="0">Gray-Blue Palette</option>
					<option value="1">Brown Palette</option>
					<option value="2">Red Palette</option>
					<option value="3">Pink Palette</option>
					<option value="4">Orange Palette</option>
					<option value="5">Yellow Palette</option>
					<option value="6">Lime Palette</option>
					<option value="7">Green Palette</option>
					<option value="8">Dark Green Palette</option>
					<option value="9">Turquoise Palette</option>
					<option value="10">Light Blue Palette</option>
					<option value="11">Blue Palette</option>
					<option value="12">Dark Blue Palette</option>
					<option value="13">Violet Palette</option>
					<option value="14">Purple Palette</option>
					<option value="15">Magenta Palette</option>
				</select>
				<button onClick={() => importRecoloredImage(image.pixels)}>Import Recolored Image</button>
			</div>
		</> : null }
	</>;
}