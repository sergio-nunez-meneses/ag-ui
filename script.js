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
	let dt = new DataTransfer();

	if (item.isDirectory) {
		item.createReader().readEntries((entries) => {
			if (entries.length > 0) {
				for (let entry of entries) {
					entry.file((file) => {
						dt.items.add(file);
					})
				}
			}
		});

		return dt.files;
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

	for (item of e.dataTransfer.items) {
		console.log(await scanFiles(item.webkitGetAsEntry()));
	}
	
	soundFilesDragOver = false;
})
