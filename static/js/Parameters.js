const optionmenu = document.querySelector(".select-menu"),
    selectbtn = optionmenu.querySelector(".select-btn"),
    options = optionmenu.querySelectorAll(".option"),
    sbtn_text = optionmenu.querySelector(".sbtn-text"),
    submit = document.getElementById("submit");

selectbtn.addEventListener("click", () => {
    optionmenu.classList.toggle("actived");
});

options.forEach(option => {
    option.addEventListener("click", () => {
        let selectedoption = option.querySelector(".option-text").innerText;
        sbtn_text.innerText = selectedoption;
        optionmenu.classList.remove("actived");
    });
});

submit.onclick = async (event) => {  
    event.preventDefault(); // Prevent the form from submitting and refreshing the page

    // Get form inputs
    const modelname = document.getElementById("modelname").value.trim();
    const oneline = document.getElementById("oneline").value.trim();
    const ranges = document.getElementById("ranges").value;
    const message = document.getElementById("message").value.trim();
    const selectedOption = sbtn_text.innerText;
    console.log(selectedOption);

//    

    // Validate inputs
    if (!modelname) {
        alert("Please enter the Model Name.");
        return;
    }
    if (!oneline) {
        alert("Please provide a One-Line Description.");
        return;
    }
    if (!ranges) {
        alert("Please set a Temperature value.");
        return;
    }
    if (!message) {
        alert("Please enter a Description.");
        return;
    }
    if (selectedOption === "Select your option") {
        alert("Please select an option from the dropdown menu.");
        return;
    }

    // Prepare data to send to the server
    const formData = {
        modelname: modelname,
        oneline: oneline,
        ranges: ranges,
        message: message,
        selectedOption: selectedOption
    };

    try {
        // Send data to the server via POST
        const response = await fetch('/process_form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('mode of agent', selectedOption);
            localStorage.setItem('Name_of_agent', modelname);
            window.location.href = 'ai_tool';
        } else {
            alert(`Failed to process data: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error processing data:", error);
        alert("An error occurred while processing data. Please try again.");
    }
};  