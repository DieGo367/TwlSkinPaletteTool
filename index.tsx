import { render } from "https://esm.sh/preact@10.11.3";
import App from "./components/App.tsx";

render(<App />, document.getElementById("root")!);

declare var LIVE_RELOAD: boolean;
if (LIVE_RELOAD) new EventSource('/esbuild').addEventListener('change', () => location.reload());