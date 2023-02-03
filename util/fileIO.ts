const fileInputElem = document.createElement("input");
fileInputElem.setAttribute("type", "file");
const downloadElem = document.createElement("a");

export function upload(accept: string) {
	return new Promise<File | null>((resolve, reject) => {
		fileInputElem.accept = accept;
		fileInputElem.onchange = () => {
			let file = fileInputElem.files?.[0];
			if (file) resolve(file);
			else reject("Missing file somehow");
			fileInputElem.value = "";
		}
		window.addEventListener("focus", () => {
			setTimeout(() => resolve(null), 1000);
		}, {once: true});
		fileInputElem.click();
	});
}

export function download(filename: string, data: Uint8Array) {
	const blob = new Blob([data]);
	const url = URL.createObjectURL(blob);
	downloadElem.setAttribute("href", url);
	downloadElem.setAttribute("download", filename);
	downloadElem.click();
	URL.revokeObjectURL(url);
}