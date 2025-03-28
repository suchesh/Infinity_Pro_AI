createnew=document.querySelectorAll(".cardbtn");
cards=document.querySelectorAll(".cards");
popupContainers=document.querySelectorAll(".popupcontainer");
closeButtons=document.querySelectorAll(".closingbtn");


cards.forEach((card, index) => {
    card.onclick = (event) => {
        // Check if the click is not on a button inside the card
        if (!event.target.classList.contains('cardbtn')) {
            popupContainers[index].classList.add('active');
            console.log(`Popup for Card ${index + 1} activated.`);
        }
    };
});

// Add click events to each close button
closeButtons.forEach((button, index) => {
    button.onclick = () => {
        popupContainers[index].classList.remove('active');
        console.log(`Popup for Card ${index + 1} closed.`);
    };
});
// document.querySelector('.cards').addEventListener('click', (event) => {
//     // Check if the clicked element is not the button
//     if (!event.target.classList.contains('cardbtn')) {
//         // Perform action for the card
//         console.log('Card clicked!');
        
//     }
// });




// // buttons[2].onclick=()=>{console.log("simple agent")};
// // //ekkada --> cards ni click cheste popup ni activate chestunam
// // //frame 1 popup
// card[0].onclick=()=>{
//     popupcontainer[0].classList.add("active");
//     console.log("Vector store rag")

// };
// closebutton[0].onclick=()=>
// {
//         popupcontainer[0].classList.remove("active");
// }


// // //frame 2 popup
// card[1].onclick=()=>{
//     popupcontainer[1].classList.add("active");

// };
// closebutton[1].onclick=()=>
//     {
//             popupcontainer[1].classList.remove("active");
//     }
    
// //frame 3 popup
// card[2].onclick=()=>{
//     popupcontainer[2].classList.add("active");

// };
// closebutton[2].onclick=()=>
// {
//     popupcontainer[2].classList.remove("active");
// }

//key points for backend

// //ekkada --> create new ki parameters.html direct avutunam


createnew[0].onclick=()=>{
   console.log("basix prompting");
   popupcontainer[0].classList.remove("active");
   //In the popup of basix prompting clicked create new (data needed:basix prompting) it redirects to the parameters.html
   window.location.href = "/parameters";
   


};

createnew[1].onclick=()=>{
    console.log("vector store rag");
    popupcontainer[1].classList.remove("active");
    //In the popup of vector store rag clicked create new (data needed:vector store rag) it redirects to the parameters.html
    window.location.href = "/parameters";

 };

 
 createnew[2].onclick=()=>{
    console.log("simple agent");
    popupcontainer[2].classList.remove("active");
      //In the popup of simple agent clicked create new (data needed:simple agent) it redirects to the parameters.html
      window.location.href = "/parameters";

 };

 popupContainers.forEach((container) => {
  container.addEventListener('click', (event) => {
      const wrapper = event.target.closest('.wrapper');
      if (wrapper) {
          const ranges = wrapper.getAttribute('ranges');
          const message = wrapper.getAttribute('message');
          const selectedOption = wrapper.getAttribute('selectedOption');
          const modelname = wrapper.querySelector('h2').textContent.trim();
          const oneline = wrapper.querySelector('p').textContent.trim();

          // Send data to the backend
          fetch('/process_selection', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  modelname: modelname,
                  oneline: oneline,
                  ranges: ranges,
                  message: message,
                  selectedOption: selectedOption,
              }),
          })
              .then((response) => response.json())
              .then((data) => {
                  if (data.success) {
                      console.log('Data successfully sent to backend');
                      localStorage.setItem('mode of agent', selectedOption);
                      localStorage.setItem('Name_of_agent', modelname);
                      window.location.href = "/ai_tool";
                  } else {
                      console.error('Error from backend:', data.message);
                  }
              })
              .catch((error) => console.error('Fetch error:', error));
      }
  });
});
