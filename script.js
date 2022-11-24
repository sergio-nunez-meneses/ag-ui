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

async function handleFileUpload(e) {
	document.getElementById("errors").innerHTML = '';

	const fileRole = e.target.closest("[id*=\"parameters\"]").id.split('-').shift();
	const errors = [];
	let uploadedFiles;

	switch (e.type) {
		case "change":
			uploadedFiles = e.target.files;
			break;
		default:
			const isFolder = [...new Set([...e.dataTransfer.files].map(uploadedFile => uploadedFile.size === 0))][0];

			if (isFolder) {
				uploadedFiles = await getFiles(e.dataTransfer); // TODO: Check file types on folder drop
			}
			else {
				uploadedFiles = e.dataTransfer.files;
			}
			break;
	}

	if (fileRole === "target") {
		if (uploadedFiles.length > 1) {
			errors.push("Please, upload just one target audio file.");
		}
	}

	const isValidFileType = [...new Set([...uploadedFiles].map(uploadedFile => uploadedFile.type.startsWith("audio")))].shift();

	if (!isValidFileType) {
		errors.push("Please, upload files just of type audio.");
	}

	if (errors.length > 0) {
		createErrorList(errors);

		if (e.type === "change") {
			e.target.value = '';
		}

		return;
	}

	await createAudioPreview(uploadedFiles, fileRole);
}

function createErrorList(errors) {
	const list = document.createElement("ul");

	for (const error of errors) {
		const item = document.createElement("li");
		item.innerText = error;
		
		list.appendChild(item);
	}
	document.getElementById("errors").appendChild(list);
}

async function createAudioPreview(uploadedFiles, fileRole) {
	document.getElementById(`preview-${fileRole}`).innerHTML = '';

	for (const uploadedFile of uploadedFiles) {
		const base64Audio = await audioToBase64(uploadedFile);
		const audio = document.createElement("audio");
		audio.id = uploadedFile.name.split('.').shift();
		audio.src = base64Audio;
		audio.controls = true;

		document.getElementById(`preview-${fileRole}`).appendChild(audio);
	}
}

function audioToBase64(file) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();
		reader.readAsDataURL(file);
		reader.addEventListener("loadend", (e) => { resolve(e.target.result); })
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
		console.log(`Dragging ${e.target.id.split('-').pop()}`);

		soundFilesDragOver = true;
	}
})
document.querySelector(".drop-zone").addEventListener("drop", async (e) => {
	e.preventDefault();
	await handleFileUpload(e);

	soundFilesDragOver = false;
})
document.querySelector(".upload-input").addEventListener("change", async (e) => {
	await handleFileUpload(e);
})
