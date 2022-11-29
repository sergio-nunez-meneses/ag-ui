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
	e.preventDefault();

	const fileRole = e.target.closest("[id*=\"container\"]").id.split('-').shift();
	const uploadedFiles = await getFiles(e);
	const errorContainerName = `${fileRole}-file`;
	const errors = [];

	if (fileRole === "target") {
		if (uploadedFiles.length > 1) {
			errors.push("Please, upload just one target audio file.");
		}
	}

	if (!await isValidFileType(uploadedFiles)) {
		errors.push("Please, upload files just of type audio.");
	}

	if (errors.length > 0) {
		createErrorList(errors, errorContainerName);

		if (e.type === "change") {
			e.target.value = '';
		}

		return;
	}
	document.getElementById(`${errorContainerName}-errors`).innerHTML = '';

	await createAudioPreview(uploadedFiles, fileRole);

	displayFilePath(uploadedFiles[0], fileRole);
}

async function getFiles(e) {
	switch (e.type) {
		case "change":
			return e.target.files;
		default:
			const isFolder = [...new Set([...e.dataTransfer.files].map(uploadedFile => uploadedFile.size === 0))].shift();

			if (isFolder) {
				return await getFilesFromFolder(e.dataTransfer.items);
			}
			return e.dataTransfer.files;
	}
}

async function getFilesFromFolder(items) {
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
			return "audio/x-wav";
		case "464f524d":
			return "audio/x-aiff";
		default:
			return "";
	}
}

function createErrorList(errors, containerName) {
	const errorContainer = document.getElementById(`${containerName}-errors`);
	const errorsExist = errorContainer.childElementCount > 0;
	const existingErrors =  errorsExist ? [...errorContainer.children[0].children].map(error => error.innerText) : [];
	const list = errorsExist ? errorContainer.firstElementChild : document.createElement("ul");
	let displayErrors = false;

	for (const error of errors) {
		if (!existingErrors.includes(error)) {
			const item = document.createElement("li");
			item.innerText = error;
			displayErrors = true;

			list.appendChild(item);
		}
	}

	if (displayErrors) {
		errorContainer.appendChild(list);
	}
}

async function createAudioPreview(files, fileRole) {
	document.getElementById(`${fileRole}-preview`).innerHTML = '';

	for (const file of files) {
		const base64Audio = await audioToBase64(file, "dataUrl");
		const audio = document.createElement("audio");
		audio.id = file.name.split('.').shift();
		audio.src = base64Audio;
		audio.controls = true;

		document.getElementById(`${fileRole}-preview`).appendChild(audio);
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

function displayFilePath(file, fileRole) {
	const fileInfo = getFileInfo(file, fileRole);
	const input = document.getElementsByName(`${fileRole}-path`)[0];
	input.value = `{Add full path to ${fileInfo.kind}}/${fileInfo.name}`;
	input.onchange = (e) => { console.log(e.target.value); };

	if (input.classList.contains("hidden")) {
		input.classList.remove("hidden");
	}
}

function getFileInfo(file, fileRole) {
	let fileKind, fileName;

	switch (fileRole) {
		case "target":
			fileKind = "file";
			fileName = file.name;
			break;
		default:
			fileKind = "folder";
			fileName = file.webkitRelativePath !== "" ? file.webkitRelativePath.split('/').shift() : "{Add folder name}";
			break;
	}

	return {
		kind: fileKind,
		name: fileName,
	}

}
// ============================================================================
//  Code to execute
// ============================================================================

// ============================================================================
//  EventListeners
// ============================================================================
document.querySelectorAll(".drop-zone")[0].addEventListener("dragover", (e) => {
	e.preventDefault();

	if (!soundFilesDragOver) {
		soundFilesDragOver = true;
	}
})
document.querySelectorAll(".drop-zone")[0].addEventListener("drop", async (e) => {
	await handleFileUpload(e);

	soundFilesDragOver = false;
})
document.getElementsByName("upload-file")[0].addEventListener("change", async (e) => {
	await handleFileUpload(e);
})
document.getElementsByName("amplitude")[0].addEventListener("input", (e) => {
	const amplitude = parseFloat(e.target.value);
	const errorContainerName = "target-amplitude";
	const errors = [];

	if (isNaN(amplitude)) {
		errors.push("Please, amplitude value must be a number.");
	}
	if (amplitude < -70 || amplitude > 6) {
		errors.push("Please, amplitude value must be between -70 and 6.");
	}

	if (errors.length > 0) {
		createErrorList(errors, errorContainerName);

		return;
	}
	document.getElementById(`${errorContainerName}-errors`).innerHTML = '';
})
