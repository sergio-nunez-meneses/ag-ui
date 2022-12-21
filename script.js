// ============================================================================
//  Imports
// ============================================================================

// ============================================================================
//  Variables
// ============================================================================
const targetLine = {};
let soundFilesDragOver = false;

// ============================================================================
//  Functions
// ============================================================================
async function handleInputs(e) {
	e.preventDefault();

	const inputName = getInputName(e.target);
	const parameterRole = inputName.split('-').shift();
	const parameterName = inputName.split('-').pop();
	const parameter = await window[`check${toTitleCase(parameterName)}`](e);

	if (parameter.error.messages.length > 0) {
		parameter.error.containerName = `${inputName}-errors`;

		createErrorList(parameter.error);

		if (e.type === "change") {
			e.target.value = '';
		}

		return;
	}
	document.getElementById(`${inputName}-errors`).innerHTML = '';

	if (parameterName === "file") {
		displayFilePath(parameter.value[0], parameterRole);
		document.getElementsByName(`${parameterRole}-path`)[0].dispatchEvent(new Event("change"));
	}

	if (parameterName !== "file") {
		window[`set${toTitleCase(parameterRole)}Line`](parameterName, parameter.value);
	}
}

async function checkFile(e) {
	const fileRole = getInputName(e.target).split('-').shift();
	const uploadedFiles = await getFiles(e);
	const errors = [];

	if (fileRole === "target") {
		if (uploadedFiles.length > 1) {
			errors.push("Please, upload just one target audio file.");
		}
	}

	if (!await isValidFileType(uploadedFiles)) {
		errors.push("Please, upload files just of type audio.");
	}

	return setParameterData(errors, uploadedFiles);

	// await createAudioPreview(uploadedFiles, fileRole);
}

function checkPath(e) {
	const path = e.target.value;
	const errors = [];

	if (path === "") {
		errors.push("Please, file path can't be empty.");
	}
	// TODO: Check for invalid characters

	return setParameterData(errors, path);
}

function checkAmplitude(e) {
	const amplitude = parseFloat(e.target.value);
	const errors = [];

	if (isNaN(amplitude)) {
		errors.push("Please, amplitude value must be a number.");
	}
	if (amplitude < -70 || amplitude > 6) {
		errors.push("Please, amplitude value must be between -70 and 6.");
	}

	return setParameterData(errors, amplitude);
}

function checkOffset(e) {
	const offset = parseFloat(e.target.value);
	const errors = [];

	if (isNaN(offset)) {
		errors.push("Please, offset value must be a number.");
	}
	if (offset < 0 || offset > 10) {
		errors.push("Please, offset value must be between 0 and 10.");
	}

	return setParameterData(errors, offset);
}

function setParameterData(errors, value) {
	return {
		error: {
			messages: errors
		},
		value: value,
	}
}

function getInputName(input) {
	return input.name ? input.name : input.id;
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
		document.getElementById("target-path-errors").classList.remove("hidden");
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

function setTargetLine(parameter, value) {
	targetLine[parameter] = value;

	if (targetLine.path) {
		console.log(targetLine);
	}
}

function toTitleCase(str) {
	return str[0].toUpperCase() + str.slice(1);
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
document.querySelectorAll("[name*=\"path\"]")[0].addEventListener("change", (e) => {
	handleInputs(e);
})
document.getElementsByName("target-amplitude")[0].addEventListener("input", (e) => {
	handleInputs(e);
})
document.getElementsByName("target-offset")[0].addEventListener("input", (e) => {
	handleInputs(e);
})
