// ============================================================================
//  Imports
// ============================================================================

// ============================================================================
//  Variables
// ============================================================================
let soundFilesDragOver = false;
let uploadedFiles;

// ============================================================================
//  Functions
// ============================================================================
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

function createErrorList(errors) {
	document.getElementById(errors.containerName).innerHTML = '';

	const list = document.createElement("ul");

	for (const error of errors.messages) {
		const item = document.createElement("li");
		item.innerText = error;

		list.appendChild(item);
	}
	document.getElementById(errors.containerName).appendChild(list);
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

async function handleInputs(e) {
	e.preventDefault();

	const inputName = getInputName(e.target);
	const parameter = inputName.split('-').pop();
	const errors = {
		containerName: `${inputName}-errors`,
		messages: await window[`${parameter}Errors`](e),
	}

	if (errors.messages.length > 0) {
		createErrorList(errors);

		if (e.type === "change") {
			e.target.value = '';
		}

		return;
	}
	document.getElementById(errors.containerName).innerHTML = '';

	// Display value
}

async function fileErrors(e) {
	const fileRole = getInputName(e.target).split('-').shift();
	const errors = [];
	uploadedFiles = await getFiles(e);

	if (fileRole === "target") {
		if (uploadedFiles.length > 1) {
			errors.push("Please, upload just one target audio file.");
		}
	}

	if (!await isValidFileType(uploadedFiles)) {
		errors.push("Please, upload files just of type audio.");
	}

	return errors;

	// await createAudioPreview(uploadedFiles, fileRole);

	// displayFilePath(uploadedFiles[0], fileRole);
}

function pathErrors(e) {
	const filePath = e.target.value;
	const errors = [];

	if (filePath === "") {
		errors.push("Please, file path can't be empty.");
	}
	// TODO: Check for invalid characters

	return errors;
}

function amplitudeErrors(e) {
	const amplitude = parseFloat(e.target.value);
	const errors = [];

	if (isNaN(amplitude)) {
		errors.push("Please, amplitude value must be a number.");
	}
	if (amplitude < -70 || amplitude > 6) {
		errors.push("Please, amplitude value must be between -70 and 6.");
	}

	return errors;
}

function getInputName(input) {
	return input.name ? input.name : input.id;
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
	await handleInputs(e);

	soundFilesDragOver = false;
})
document.querySelectorAll("[name*=\"file\"]")[0].addEventListener("change", async (e) => {
	await handleInputs(e);
})
document.querySelector("[name*=\"path\"]").addEventListener("change", (e) => {
	handleInputs(e);
})
document.getElementsByName("target-amplitude")[0].addEventListener("input", (e) => {
	handleInputs(e);
})
