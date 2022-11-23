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

function checkTargetSoundFileUpload(e) {
	let uploadedFiles = e.type === "change" ? e.target : e.dataTransfer;
	const errors = [];

	if (uploadedFiles.files.length > 1) {
		errors.push("Please, upload just one file.");
	}
	if (uploadedFiles.files[0].type.split('/')[0] !== "audio") {
		errors.push("Please, upload just audio files.");
	}

	return errors;
}

async function previewUploadedSoundFiles(soundFiles) {
	document.getElementById("preview-target").innerHTML = '';

	for (const soundFile of soundFiles) {
		const base64Audio = await audioToBase64(soundFile);

		document.getElementById("preview-target").appendChild(
			previewAudio(soundFile.name, base64Audio)
		);
	}
}

function audioToBase64(soundFile) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.onloadend = (e) => { resolve(e.target.result); };
		reader.readAsDataURL(soundFile);
	});
}

function previewAudio(fileName, base64Audio) {
	const audio = document.createElement("audio");
	audio.id = fileName.split('.')[0];
	audio.src = base64Audio;
	audio.controls = true;

	return audio;
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
		console.log(`Dragging ${e.target.id.split('-')[1]}`);

		soundFilesDragOver = true;
	}
})
document.querySelector(".drop-zone").addEventListener("drop", async (e) => {
	e.preventDefault();

	let errors = checkTargetSoundFileUpload(e);

	if (errors.length > 0) {
		for (const error of errors) {
			console.error(error);
		}
		return;
	}

	await previewUploadedSoundFiles(e.dataTransfer.files);

	//console.log(await getFiles(e.dataTransfer));

	soundFilesDragOver = false;
})
document.querySelector(".upload-input").addEventListener("change", async (e) => {
	let errors = checkTargetSoundFileUpload(e);

	if (errors.length > 0) {
		for (const error of errors) {
			console.error(error);
		}
		return;
	}

	await previewUploadedSoundFiles(e.target.files);
})
