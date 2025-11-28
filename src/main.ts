import "./style.css";
import p5 from "p5";
import { connectWallet } from "./wallet";
import { loadSketches, saveSketch, type Sketch } from "./sketch";

let userAddress: string | null = null;
let sketches: Sketch[] = [];
let p5Instance: p5 | null = null;

// DOM elements
const connectBtn = document.getElementById("connect-btn") as HTMLButtonElement;
const accountDiv = document.getElementById("account") as HTMLDivElement;
const sketchList = document.getElementById("sketch-list") as HTMLDivElement;
const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const canvasContainer = document.getElementById(
	"canvas-container",
) as HTMLDivElement;

// Connect wallet
connectBtn.addEventListener("click", async () => {
	try {
		connectBtn.disabled = true;
		connectBtn.textContent = "Connecting...";
		userAddress = await connectWallet();
		accountDiv.textContent = `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`;
		connectBtn.style.display = "none";
		await refreshSketches();
	} catch (error) {
		console.error("Failed to connect:", error);
		alert(`Failed to connect wallet: ${(error as Error).message}`);
		connectBtn.disabled = false;
		connectBtn.textContent = "Connect MetaMask";
	}
});

// Refresh sketches from Arkiv
async function refreshSketches() {
	if (!userAddress) return;

	try {
		sketchList.innerHTML = "<p>Loading sketches...</p>";
		sketches = await loadSketches(userAddress);
		renderSketchList();
	} catch (error) {
		console.error("Failed to load sketches:", error);
		sketchList.innerHTML = "<p>Failed to load sketches</p>";
	}
}

// Render sketch list
function renderSketchList() {
	if (sketches.length === 0) {
		sketchList.innerHTML = "<p>No sketches yet. Draw something!</p>";
		return;
	}

	sketchList.innerHTML = sketches
		.map((sketch) => {
			const date = new Date(sketch.timestamp).toLocaleString();
			return `
        <div class="sketch-item">
          <img src="${sketch.imageData}" alt="Sketch" />
          <div class="sketch-info">
            <small>${date}</small>
          </div>
          <a href="https://explorer.mendoza.hoodi.arkiv.network/entity/${sketch.id}" target="_blank" class="entity-link">
            ${sketch.id.slice(0, 12)}...
          </a>
        </div>
      `;
		})
		.join("");
}

// Setup p5.js canvas
const sketch = (p: p5) => {
	p.setup = () => {
		const containerWidth = canvasContainer.offsetWidth;
		p.createCanvas(containerWidth, containerWidth);
		p.background(255);
	};

	p.draw = () => {
		if (p.mouseIsPressed) {
			p.stroke(0);
			p.strokeWeight(2);
			p.line(p.mouseX, p.mouseY, p.pmouseX, p.pmouseY);
		}
	};
};

p5Instance = new p5(sketch, canvasContainer);

// Reset canvas
resetBtn.addEventListener("click", () => {
	if (p5Instance) {
		p5Instance.background(255);
	}
});

// Save sketch
saveBtn.addEventListener("click", async () => {
	if (!userAddress || !p5Instance) return;

	try {
		saveBtn.disabled = true;
		saveBtn.textContent = "Saving...";

		// Get canvas element and convert to image data
		const canvas = document.querySelector(
			"#canvas-container canvas",
		) as HTMLCanvasElement;
		const imageData = canvas.toDataURL("image/png");

		await saveSketch(imageData, userAddress);

		// Reset canvas and refresh list
		p5Instance.background(255);
		await refreshSketches();

		saveBtn.disabled = false;
		saveBtn.textContent = "Save";
	} catch (error) {
		console.error("Failed to save sketch:", error);
		alert(`Failed to save sketch: ${(error as Error).message}`);
		saveBtn.disabled = false;
		saveBtn.textContent = "Save";
	}
});
