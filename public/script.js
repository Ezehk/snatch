const addBtn = document.querySelector("#add_btn");
let removeBtn;
const checkboxes = document.querySelectorAll('.device input[type="checkbox"]');

addBtn.addEventListener("click", function () {
  let template = `<div class="formEl extra_url">
            <label for="search">{label}</label>
            <input type="text" id="{id}" name="urls" class="inputEl" /><span class="remove_btn">x</span><br />
          </div>`;

  const inputs = document.querySelectorAll(".formEl");
  const index = inputs.length - 3;

  if (inputs.length <= 9) {
    template = template
      .replace("{label}", `Extra URL ${index}:`)
      .replace("{id}", `extra_url_${index}`);

    const el = document.createElement("div");
    el.innerHTML = template;
    inputs[inputs.length - 1].after(el);

    if (inputs.length === 9) {
      addBtn.style.display = "none";
    }
  }

  const updateFormEls = function (formEls) {
    formEls.forEach((el, index) => {
      const label = el.querySelector("label");
      const input = el.querySelector("input");
      label.textContent = `Extra URL ${index + 1}:`;
      input.id = `extra_url_${index + 1}`;
    });
  };

  removeBtn = document.querySelectorAll(".remove_btn");
  removeBtn.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.parentNode.remove();
      updateFormEls(document.querySelectorAll(".extra_url"));
    });
  });
});

checkboxes.forEach(function (checkbox) {
  checkbox.addEventListener("change", function () {
    // If the current checkbox is unchecked, automatically check the other one
    if (!this.checked) {
      checkboxes.forEach(function (otherCheckbox) {
        if (otherCheckbox !== checkbox) {
          otherCheckbox.checked = true;
        }
      });
    }
  });
});

function showMessage(event) {
  event.preventDefault(); // Prevent default form submission behavior
  document.querySelector("#loadingSpinner").style.display = "block";

  // Get the form data
  const formData = new FormData(document.getElementById("screenForm"));

  // Serialize the form data
  const urlSearchParams = new URLSearchParams(formData);
  const serializedFormData = new URLSearchParams(urlSearchParams).toString();

  // Send a POST request to the server asynchronously
  fetch("/public", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: serializedFormData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob(); // Assuming the server responds with a zip file
    })
    .then((blob) => {
      // Create a temporary link element
      const link = document.createElement("a");

      // Create a blob URL for the zip file
      const blobUrl = window.URL.createObjectURL(blob);

      // Set the link's href to the blob URL
      link.href = blobUrl;

      // Specify the filename for the download
      link.download = "screenshots.zip";

      // Append the link to the document
      document.body.appendChild(link);

      // Trigger a click on the link to start the download
      link.click();

      // Remove the link from the document
      document.body.removeChild(link);

      document.querySelector("#loadingSpinner").style.display = "none";
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });
}
