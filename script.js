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
			const isFolder = [...new Set([...e.dataTransfer.files].map(uploadedFile => uploadedFile.size === 0))].shift();

			if (isFolder) {
				uploadedFiles = await getFiles(e.dataTransfer.items);
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

	if (!await isValidFileType(uploadedFiles)) {
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

	console.log(setFilePath(uploadedFiles[0], fileRole));
}

async function getFiles(items) {
	let entryContent;

	for (const item of items) {
		if (item.webkitGetAsEntry()) {
			const entry = item.webkitGetAsEntry();
			entryContent = await readEntryContent(entry);
		}
	}
	return entryContent.files;
}

function readEntryContent(entry) {
    return new Promise((resolve, reject) => {
        const files = new DataTransfer();
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
	        			resolve(files);
	        		}
	            });
        	}
            else {
            	entry.file(async (file) => {
            		counter--;
            		files.items.add(file);

            		if (counter === 0) {
            			resolve(files);
            		}
            	});
            }
        }
    });
}

async function isValidFileType(files) {
	return await [...new Set([...files].map(async (file) => {
			const fileType = await getFileType(file);
			return fileType.startsWith("audio");
		})
	)].shift();
}

async function getFileType(file) {
	const arrayBuffer = await audioToBase64(file, "arrayBuffer");
	let header = "";

	for (const bytes of new Uint8Array(arrayBuffer).slice(0, 4)) {
		header += bytes.toString(16);
	}

	switch (header) {
		case "52494646":
			return "audio/wave";
		case "464f524d":
			return "audio/aiff";
		default:
			return "";
	}
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

async function createAudioPreview(files, fileRole) {
	document.getElementById(`preview-${fileRole}`).innerHTML = '';

	for (const file of files) {
		const base64Audio = await audioToBase64(file, "dataUrl");
		const audio = document.createElement("audio");
		audio.id = file.name.split('.').shift();
		audio.src = base64Audio;
		audio.controls = true;

		document.getElementById(`preview-${fileRole}`).appendChild(audio);
	}
}

function audioToBase64(file, readerMethod) {
	return new Promise((resolve, reject) => {
		let reader = new FileReader();

		if (readerMethod === "dataUrl") {
			reader.readAsDataURL(file);
		}
		else {
			reader.readAsArrayBuffer(file);
		}
		reader.addEventListener("loadend", (e) => { resolve(e.target.result); })
	});
}

function setFilePath(file, fileRole) {
	const isFileOrFolder = fileRole === "target" ? "file" : "folder";
	const fileOrFolderName = fileRole === "target" ? file.name : file.webkitRelativePath.split('/').shift();

	return `{Add full path to ${isFileOrFolder}}/${fileOrFolderName}`;
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
