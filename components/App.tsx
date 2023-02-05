import { useState } from "https://esm.sh/preact@10.11.3/hooks";

import { PaletteCollection } from "./palette.tsx";
import PalettedImageTab from "./PalettedImageTab.tsx";
import FontTab from "./FontTab.tsx";

import { BGR15_to_CSS, CSS_to_BGR15 } from "../util/color.ts";
import { getShortBE, putShortBE } from "../util/data.ts";
import { download, upload } from "../util/fileIO.ts";

type EditorMode = "paletted" | "font";

const emptyPalettes = Array<number[]>(16).fill(Array<number>(16).fill(0));

export default function App() {
	const [editorMode, setEditorMode] = useState<EditorMode>("paletted");
	const [palettes, setPalettes] = useState(emptyPalettes);
	const [slot, selectSlot] = useState<[number, number]>([0, 0]);
	const [previewIdx, setPreviewIdx] = useState(-1);
	const [suggestedName, setSuggestedName] = useState("palette");
	const currentColor = palettes[slot[0]][slot[1]] ?? 0;

	async function importPalette() {
		const file = await upload(".bin");
		if (file) {
			const buffer = await file.arrayBuffer();
			const data = new Uint8Array(buffer);
			const newPalettes = [];
			const palLen = editorMode === "paletted" ? 16 : 4;
			for (let i = 0; i < palettes.length; i++) {
				const palette = [];
				for (let j = 0; j < palLen; j++) {
					palette.push(getShortBE(data, (i * palLen + j) * 2));
				}
				newPalettes.push(palette);
			}
			setPalettes(newPalettes);
		}
	}
	function exportPalette() {
		const palLen = editorMode === "paletted" ? 16 : 4;
		const data = new Uint8Array(palLen * palettes.length * 2);
		for (let i = 0; i < palettes.length; i++) {
			for (let j = 0; j < palLen; j++) {
				putShortBE(data, (i * palLen + j) * 2, palettes[i][j]);
			}
		}
		download(suggestedName + ".bin", data);
	}

	function switchMode() {
		if (editorMode === "paletted") {
			setEditorMode("font");
			if (slot[1] > 3) selectSlot([slot[0], 3]);
		}
		else setEditorMode("paletted");
	}

	function setColor(colorBGR15: number) {
		const newPalettes = palettes.slice(); // new array referencing the same palettes
		newPalettes[slot[0]] = palettes[slot[0]].slice(); // use a new copy of the edited palette
		newPalettes[slot[0]][slot[1]] = colorBGR15; // edit the copy
		setPalettes(newPalettes);
	}
	function setPalette(idx: number, palette: number[]) {
		const newPalettes = palettes.slice();
		newPalettes[idx] = palette;
		setPalettes(newPalettes);
	}
	function setAllPalettes(palette: number[]) {
		const newPalettes: number[][] = [];
		for (let i = 0; i < palettes.length; i++) {
			newPalettes.push(palette.slice());
		}
		setPalettes(newPalettes);
	}
	
	return <div class="grid" style={{textAlign: "center"}}>
		<div>
			<PalettedImageTab
				enabled={editorMode === "paletted"}
				palettes={palettes}
				previewIdx={previewIdx}
				onImport={filename => {
					setSuggestedName(filename.substring(0, filename.length - 4));
					setPreviewIdx(-1);
				}}
				onPaletteHover={() => setPreviewIdx(-1)}
				onCopyToAll={setAllPalettes}
				onRecolorImport={setPalette}
			/>
			<FontTab
				enabled={editorMode === "font"}
				palettes={palettes}
				previewIdx={previewIdx}
			/>
		</div>
		<div>
			<h3>Palette Collection</h3>
			<div class="grid">
				<button onClick={importPalette}>Import palette.bin</button>
				<button onClick={exportPalette}>Export palette.bin</button>
			</div>
			<button onClick={switchMode}>{editorMode === "paletted" ? "Switch to Font Mode" : "Switch to Image Mode"}</button>
			<PaletteCollection
				palettes={palettes}
				paletteLength={editorMode === "paletted" ? 16 : 4}
				selected={slot}
				onColorClick={(row, col) => selectSlot([row, col])}
				onPaletteHover={idx => setPreviewIdx(idx)}
			/>
		</div>
		<div>
			<h3>Color Picker</h3>
			<p>Editing palette #{slot[0]} color #{slot[1]}</p>
			<input type="color"
				onChange={e => setColor(CSS_to_BGR15(e.currentTarget.value))}
				value={BGR15_to_CSS(currentColor)}
			/>
			<div class="grid">
				<label>
					BGR15
					<input type="text"
						onChange={e => {
							const color = parseInt(e.currentTarget.value, 16);
							if (!isNaN(color)) setColor(color);
						}}
						value={currentColor.toString(16).padStart(4, '0')}
						placeholder="0000"
					/>
				</label>
				<label>
					RGB
					<input type="text"
						onChange={e => setColor(CSS_to_BGR15("#" + e.currentTarget.value))}
						value={BGR15_to_CSS(currentColor).substring(1, 7)}
						placeholder="000000"
					/>
				</label>
			</div>
		</div>
	</div>;
}