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
async function getFiles(dataTransfer) {
	const files = [];

	for (const item of dataTransfer.items) {
		if (item.kind.split('/')[0] !== "audio") {
			// End function execution
		}

		if (item.webkitGetAsEntry()) {
			const entry = item.webkitGetAsEntry();
			const entryContent = await readEntryContent(entry);

			files.push(...entryContent);
		}
	}
	return files;
}

function readEntryContent(entry) {
    return new Promise((resolve, reject) => {
        const contents = [];
    	let counter = 0;

        readEntry(entry);

        function readEntry(entry) {
        	counter++;

        	if (entry.isDirectory) {
	        	entry.createReader().readEntries((entries) => {
	        		counter--;

	        		for (const entry of entries) {
	        			readEntry(entry);
	        		}

	        		if (counter === 0) {
	        			resolve(contents);
	        		}
	            });
        	}
            else {
            	entry.file((file) => {
            		counter--;
            		contents.push(file);

            		if (counter === 0) {
            			resolve(contents);
            		}
            	});
            }
        }
    });
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
document.querySelector(".drop-zone").addEventListener("drop", async (e) => {
	e.preventDefault();

	console.log(`Dropped ${e.target.id}:`);
	console.log(await getFiles(e.dataTransfer));
	
	soundFilesDragOver = false;
})
