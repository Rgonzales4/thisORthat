function fetchJSONData() {
  fetch("./data.json")
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }

      return res.json();
    })
    .then((data) => {
      const mainCategories = Object.keys(data["categories"]);
      for (const category of mainCategories) {
        document.getElementById("mainCategoryDiv").innerHTML += `<div class="btn" onclick="mainCatSelect('${category}')">${category}</div>`;
      }
      console.log({ mainCategories });
    })
    .catch((error) => console.error("Unable to fetch data:", error));
}
fetchJSONData();
console.log("hello");

function mainCatSelect(category) {
  localStorage.setItem("mainCategory", category);
  console.log("chosen Main Category: ", category);
}
