// ============================================================================
//  Imports
// ============================================================================

// ============================================================================
//  Variables
// ============================================================================
let soundFilesDragOver = false;

// ============================================================================
//  Functions
// ============================================================================
function scanFiles(item) {
	if (item.isDirectory) {
		item.createReader().readEntries((entries) => {
			console.log(`Uploaded files: ${entries.length}`);

			entries.forEach((entry) => {
				scanFiles(entry);
			});
		});
	}
}

// ============================================================================
//  Code to execute
// ============================================================================

// ============================================================================
//  EventListeners
// ============================================================================
document.querySelector(".drop-zone").addEventListener("dragover", (e) => {
	e.preventDefault();

	if (!soundFilesDragOver) {
		console.log(`Dragging ${e.target.id}`);

		soundFilesDragOver = true;
	}
})
document.querySelector(".drop-zone").addEventListener("drop", (e) => {
	e.preventDefault();

	console.log(`Dropped ${e.target.id}:`);

	// If corpus ?
	for (let item of e.dataTransfer.items) {
		if (item.webkitGetAsEntry()) {
			scanFiles(item.webkitGetAsEntry());
		}
	}

	soundFilesDragOver = false;
})
