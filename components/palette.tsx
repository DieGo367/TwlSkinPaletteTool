import type { JSX } from "https://esm.sh/preact@10.11.3";

import { BGR15_to_CSS } from "../util/color.ts";

type PaletteColorProps = {
	color: number;
	selected?: boolean;
	unused?: boolean;
} & JSX.HTMLAttributes<HTMLTableCellElement>;

export function PaletteColor({color, selected, unused, ...rest}: PaletteColorProps) {
	return <td
		class={"palColor" + (selected ? " selected" : "")}
		{...rest}
		style={{backgroundColor: BGR15_to_CSS(color)}}
	>
		{unused ? "🚫" : ""}
	</td>;
}

type PaletteViewProps = {
	palette: number[];
	paletteLength?: number;
	selected?: number;
	firstUnused?: boolean;
	onColorClick?: (idx: number) => void;
} & Omit<JSX.HTMLAttributes<HTMLTableRowElement>, "selected">;

export function PalleteView({palette, paletteLength, selected, firstUnused, ...rest}: PaletteViewProps) {
	const colorCells: JSX.Element[] = [];
	const count = paletteLength ?? palette.length;
	for (let i = 0; i < count; i++) {
		colorCells.push(<PaletteColor
			color={palette[i]}
			selected={i === selected}
			unused={firstUnused && i === 0}
			onClick={() => rest.onColorClick?.(i)}
		/>);
	}
	return <tr {...rest}>{colorCells}</tr>;
}

type PaletteCollectionProps = {
	palettes: number[][];
	paletteLength?: number;
	selected?: [number, number];
	onColorClick?: (row: number, col: number) => void;
	onPaletteHover?: (idx: number) => void;
} & Omit<JSX.HTMLAttributes<HTMLTableElement>, "selected">;

export function PaletteCollection({palettes, paletteLength, selected, onColorClick, onPaletteHover, ...rest}: PaletteCollectionProps) {
	return <table class="ib" {...rest}>
		<tbody>
			{palettes.map((palette, i) => <PalleteView
				palette={palette}
				paletteLength={paletteLength}
				selected={selected?.[0] === i ? selected[1] : undefined}
				firstUnused={true}
				onMouseEnter={() => onPaletteHover?.(i)}
				onColorClick={j => onColorClick?.(i, j)}
			/>)}
		</tbody>
	</table>;
}