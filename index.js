// TODO: I COULD paste the data in this file rather than reading from a separate JSON file?
/* 
	Data structure: 
	{
		"mainCategory": {
			"subCategory" : {
				"option1" : linkToImg,
				"option2" : linkToImg,
				...
			},
			...
		},
		...
	}
*/

// fetchJSONData() is purely to render category options + redirect user to the correct page, depending on chosen categories
function fetchJSONData() {
	fetch("./data.json")
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}

			return res.json();
		})
		.then((data) => {
			console.log(window.location.pathname);

			// If on homepage (main), render the main categories onto the page
			const mainCategories = Object.keys(data);
			const mainCategoryDiv = document.getElementById("mainCategoryDiv");
			if (mainCategoryDiv) {
				for (const category of mainCategories) {
					mainCategoryDiv.innerHTML += `<div class="btn" onclick="mainCatSelect('${category}')">${category}</div>`;
				}
				/* TODO: Hide "All" option till the basic game func has been completed 
          + to allow the "All" option, "category choosing" logiic needs to be reworked */
				// if (!document.getElementById("allOption")) {
				// 	mainCategoryDiv.innerHTML += `<div class="btn" id="allOption" onclick="mainCatSelect('All')">All</div>`;
				// }
			}

			// If categories page, render the sub categories onto the page
			// Note: A main category SHOULD be chosen at this point, if not, redirect them back to main page
			const subCategoryDiv = document.getElementById("subCategoriesDiv");
			const mainCategoryTitle = document.getElementById("mainCategoryTitle");
			if (subCategoryDiv && mainCategoryTitle) {
				const chosenCat = localStorage.getItem("mainCategory");
				if (chosenCat) {
					mainCategoryTitle.innerHTML = chosenCat;
					for (const subCategory of Object.keys(data[chosenCat])) {
						subCategoryDiv.innerHTML += `<div class="btn" onclick="subCatSelect('${subCategory}')">${subCategory}</div>`;
					}
					if (!document.getElementById("allOption")) {
						subCategoryDiv.innerHTML += `<div class="btn" id="allOption" onclick="subCatSelect('All')">All</div>`;
					}
				} else {
					console.log("Main category hasn't been chosen. Redirecting to homepage");
					window.location.pathname = "/index.html";
				}
			}

			// On some reload - If a main + sub category is selected, redirect user to games page (if they're not in it already)
			const chosenMainCategory = localStorage.getItem("mainCategory");
			const chosenSubCategory = localStorage.getItem("subCategory");
			if (chosenMainCategory && chosenSubCategory) {
				const gameTitle = document.getElementById("gameTitle");
				if (gameTitle) {
					gameTitle.innerHTML = chosenMainCategory + " : " + chosenSubCategory;
				} else {
					// If the user is in a diff page WITH chosen main and sub categories, redirect user to the game
					console.log(`Resume game for chosen categories: ${chosenMainCategory} - ${chosenSubCategory}`);
					window.location.pathname = "/game.html";
				}
			}
		})
		.catch((error) => console.error("Unable to fetch data", error));
}

// Store Main category + redirect
function mainCatSelect(category) {
	console.log("chosen Main Category: ", category);
	localStorage.setItem("mainCategory", category);
	window.location.pathname = "/categories.html";
}

// Store Sub category + redirect
function subCatSelect(subCateory) {
	console.log("chosen Sub Category: ", subCateory);
	localStorage.setItem("subCategory", subCateory);
	window.location.pathname = "/game.html";
}

// Read and Render category options
fetchJSONData();

function backToHome() {
	localStorage.clear();
	window.location.pathname = "/index.html";
}

// Listener: On Webpage title click, redirect to homepage
document.getElementById("titleHeading").addEventListener("click", () => {
	backToHome();
});

// Game Logic
/* 
1. Load in choices
2. Make random pairs, non-repeating
3. Load a pair one at a time - change pair on card click
  3.1. Add some kind of animation on card click
*/
function createPairs() {
	fetch("./data.json")
		.then((res) => {
			if (!res.ok) {
				throw new Error(`HTTP error! Status: ${res.status}`);
			}

			return res.json();
		})
		.then((data) => {
			// On some reload - If a main + sub category is selected, redirect user to games page (if they're not in it already)
			const mainCategory = localStorage.getItem("mainCategory");
			const subCategory = localStorage.getItem("subCategory");

			// If the categories (somehow) hasn't been chosen, redirect user to homepage.
			if (!mainCategory || !subCategory) {
				console.log("Categories hasn't been chosen. Redirecting to homepage", { mainCategory, subCategory });
				window.location.pathname = "/index.html";
				return;
			}

			// If there's no pairs, create pairs
			if (!localStorage.getItem("pairs")) {
				console.log("Creating pairs.");

				// Get options
				const options = Object.keys(data[mainCategory][subCategory]);
				console.log(options);
				if (!options) {
					console.log("No options found", { mainCategory, subCategory });
					backToHome();
					return;
				}

				// TODO: check if options have been formatted - load them instead of remaking options...

				const pairs = [];
				// Create random pairs, non-repeating
				if (options.length % 2 != 0) {
					alert("You must have an even number of options. You currently have " + options.length + " options.");
					backToHome();
					return;
				}

				// Create arr to keep track of which options have been used already
				const seenOptions = [];

				// Copy and shuffle the options
				const shuffledOptions = options.slice();
				shuffledOptions.sort(() => 0.5 - Math.random()); // shuffle arrays

				// Create pairs
				for (const o of shuffledOptions) {
					// Check if options has been used already
					if (seenOptions.find((f) => f === o)) {
						continue;
					}
					seenOptions.push(o);

					// Get pair value
					let pairVal = undefined;
					while (pairVal === undefined) {
						// Get a random option
						const randomIndex = [Math.floor(Math.random() * shuffledOptions.length)];
						const randomOpt = shuffledOptions[randomIndex];
						if (seenOptions.find((f) => f === randomOpt)) {
							continue;
						}
						pairVal = randomOpt;
						seenOptions.push(randomOpt);
						// TODO: Remove the option from shuffledOptions? to optimise logic - not needed tho
					}

					// Store pair
					pairs.push([o, pairVal]);
				}

				console.log("Saving pairs", pairs);
				localStorage.setItem("pairs", JSON.stringify(pairs));
			}

			gameLogic(data, mainCategory, subCategory);

			// const localStoragePairs = localStorage.getItem("pairs");
			// console.log("localStoragePairs: ", localStoragePairs);
		})
		.catch((error) => console.error("Unable to create pairs", error));
}

function gameLogic(data, mainCategory, subCategory) {
	/* 
		At this point, it's safe to assume that the pairs have been created bc this func is ONLY
		called from createPairs().  
	*/

	// Make sure the user is in the correct page (game.html).
	const gameTitle = document.getElementById("gameTitle");
	if (!gameTitle) {
		console.log("Attempting to load Game Logic, but it appears the user is in the wrong page.");
		backToHome();
	}

	// Get pairs
	const localStoragePairs = localStorage.getItem("pairs");
	const parsedPairs = JSON.parse(localStoragePairs) || [];

	// currentIndex keeps track of which pair to show
	const currentIndex = localStorage.getItem("currentIndex") || 0;
	console.log({ pairs: parsedPairs, currentIndex });

	// If currentIndex is greater than the number of items = end of game.
	if (currentIndex > parsedPairs.length - 1) {
		console.log("End of pairs.");
		document.getElementById("gameDiv").style.display = "none";
		if(parsedPairs.length < 1){
			document.getElementById("noDataDiv").style.display = "flex";
		} else {
			document.getElementById("endOfGameDiv").style.display = "flex";
		}
	}

	// Get current slide
	const options = parsedPairs[currentIndex];
	console.log("Current Slide:", options);

	// Display labels + images
	const option1 = options[0],
		option2 = options[1];
	// Labels
	document.getElementById("topCardLabel").innerHTML = option1;
	document.getElementById("bottomCardLabel").innerHTML = option2;
	// Images
	document.getElementById("topCardImg").src = data[mainCategory][subCategory][option1];
	document.getElementById("bottomCardImg").src = data[mainCategory][subCategory][option2];

	// Update pairs list + Current index tracker
	localStorage.setItem("pairs", JSON.stringify(parsedPairs));
	localStorage.setItem("currentIndex", currentIndex);
}

function nextIndex() {
	let currentIndex = JSON.parse(localStorage.getItem("currentIndex")) || 0;
	localStorage.setItem("currentIndex", currentIndex + 1);
	window.location.reload();
}

document.getElementById("topCard").addEventListener("click", () => {
	console.log("topCard");
	nextIndex();
});

document.getElementById("bottomCard").addEventListener("click", () => {
	console.log("bottomCard");
	nextIndex();
});

if (window.location.pathname.includes("game.html")) {
	createPairs();
}
