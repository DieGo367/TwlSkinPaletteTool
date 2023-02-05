import type { JSX } from "https://esm.sh/preact@10.11.3";

import { BGR15_to_CSS } from "../util/color.ts";

type PaletteColorProps = {
	color: number;
	selected?: boolean;
	unused?: boolean;
} & JSX.HTMLAttributes<HTMLSpanElement>;

export function PaletteColor({color, selected, unused, ...rest}: PaletteColorProps) {
	return <span
		{...rest}
		style={{
			display: "inline-block",
			verticalAlign: "top",
			boxSizing: "border-box",
			width: "1.4rem",
			height: "1.4rem",
			backgroundColor: BGR15_to_CSS(color),
			border: selected ? "0.2rem inset gold" : "",
			fontSize: selected ? "75%" : "90%",
			lineHeight: selected ? "130%" : "155%",
		}}
	>
		{unused ? "🚫" : ""}
	</span>;
}

type PaletteViewProps = {
	palette: number[];
	paletteLength?: number;
	selected?: number;
	firstUnused?: boolean;
	onColorClick?: (idx: number) => void;
} & Omit<JSX.HTMLAttributes<HTMLDivElement>, "selected">;

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
	return <div {...rest}>{colorCells}</div>;
}

type PaletteCollectionProps = {
	palettes: number[][];
	paletteLength?: number;
	selected?: [number, number];
	onColorClick?: (row: number, col: number) => void;
	onPaletteHover?: (idx: number) => void;
} & Omit<JSX.HTMLAttributes<HTMLElement>, "selected">;

export function PaletteCollection({palettes, paletteLength, selected, onColorClick, onPaletteHover, ...rest}: PaletteCollectionProps) {
	return <figure {...rest}>
		{palettes.map((palette, i) => <PalleteView
			palette={palette}
			paletteLength={paletteLength}
			selected={selected?.[0] === i ? selected[1] : undefined}
			firstUnused={true}
			onMouseEnter={() => onPaletteHover?.(i)}
			onColorClick={j => onColorClick?.(i, j)}
			style={{whiteSpace: "nowrap"}}
		/>)}
	</figure>;
}