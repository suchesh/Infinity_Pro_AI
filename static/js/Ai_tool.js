

const messageform=document.querySelector(".prompt--form");
const inputbox=document.querySelector(".prompt--form--input");
const chathistorycontainer=document.querySelector(".chats");
const clearChatbutton=document.getElementById("deleteButton");
const filelinker=document.getElementById("filelinker");
const sendbutton=document.getElementById("sendbutton");

//notification alerts declaration
const toastbox=document.querySelector('.toastalert');

const Success="<i class='bx bxs-check-circle'></i> File upload success";
let Info="<i class='bx bxs-info-circle'></i>Require necessary files";
let Warning="<i class='bx bxs-binoculars'></i>Check the files";
let Errors="<i class='bx bxs-error' ></i> Not Required file.";

function showtoast(msg){
    let toast =document.createElement('div');
    toast.classList.add("toast");
    if(msg.includes("<i class='bx bxs-info-circle'")){
        toast.classList.add('Info');

    }
    if(msg.includes("<i class='bx bxs-binoculars'")){
        toast.classList.add('Warning');
    
    }
    if(msg.includes("<i class='bx bxs-error'")){
        toast.classList.add('Errors');
        
    }
    toast.innerHTML=msg;
    toastbox.appendChild(toast);
    setTimeout(()=>{
        removetoast(toast);
    },3000);
}
function removetoast(toast){
    toast.classList.add("hidealert");
    setTimeout(()=>{
     toastbox.removeChild(toast);
    },500)
}

//Fileuploaders and their buttons declaration

CommonFilebtn=document.getElementById("CommonUploader");
ExcelFilebtn=document.getElementById("ExcelUploader");
ImageFilebtn=document.getElementById("ImageUploader");

PDFbtn=document.getElementById("PDF");
EXCELbtn=document.getElementById("EXCEL");
IMAGEbtn=document.getElementById("IMAGE");

PDFbtn.onclick=()=>{
    CommonFilebtn.click();
  
}
IMAGEbtn.onclick=()=>{
    ImageFilebtn.click();
    console.log("image file needed")

}
EXCELbtn.onclick=()=>{
    ExcelFilebtn.click();
    console.log("Excel file needed")
}
// Getting savedSelction 
const savedSelection = localStorage.getItem('mode of agent');

const fileTypeConfig = {
    "Image Agents": { required: ["image"], notAllowed: ["excel", "pdf"] },
    "RAG Applications": { required: ["pdf"], notAllowed: ["excel", "image"] },
    "Excel Sheet Analyzer": { required: ["excel"], notAllowed: ["pdf", "image"] },
    "Multi Purpose Agent": { required: ["pdf", "excel"], notAllowed: ["image"] },
    "Text-to-Text": { required: [], notAllowed: ["pdf", "excel","image"] },

};

// Function to handle file input

function handleFileInput(event, fileType) {
    const config = fileTypeConfig[savedSelection] || { required: [], notAllowed: [] };
    const { required, notAllowed } = config;

    if (notAllowed.includes(fileType)) {
       showtoast(Errors)
        event.target.value = "";
         // Clear the input
        return;
    }
}

// filestatus state variable
let filestatus=false;
function validateUploads() {
    const config = fileTypeConfig[savedSelection] || { required: [], notAllowed: [] };

    // Check if all required files have been uploaded
    const missingFiles = config.required.filter((type) => {
        if (type === "image") return !ImageFilebtn.files.length;
        if (type === "excel") return !ExcelFilebtn.files.length;
        if (type === "pdf") return !CommonFilebtn.files.length;
        return false;
    });

    // If any required files are missing, alert and return false
    if (missingFiles.length) {
        // alert(`Please upload the following required files: ${missingFiles.join(", ")}`);
        Warning=`<i class='bx bxs-binoculars'></i>Upload Required Files: ${missingFiles.join(", ").toUpperCase()}`
        showtoast(Warning)
        return false; // Validation failed
    }


    // Check if the uploaded files are of the correct type
    // Check image file
    if (ImageFilebtn.files.length) {
        const file = ImageFilebtn.files[0];
        if (!file.type.startsWith('image/')) {  // Checks if the file is an image
            // alert("Please upload a valid image file for the image input.");
            Errors="<i class='bx bxs-error' ></i> Need Valid Image File."
            showtoast(Errors)
            ImageFilebtn.value = "";
            filestatus=false;  // Clear the input
            return false;
        }
        else if(!filestatus){
            showtoast(Success)
            filestatus=true;
          
        }
    }

    // Check excel file
    if (ExcelFilebtn.files.length) {
        const file = ExcelFilebtn.files[0];
        if (!file.name.endsWith('.xls') && !file.name.endsWith('.xlsx')) {
            // alert("Please upload a valid Excel file (.xls or .xlsx).");
            Errors="<i class='bx bxs-error' ></i> Need Valid Excel File."
            showtoast(Errors)
            ExcelFilebtn.value = "";
            filestatus=false;  
            return false;
        }
        else if(!filestatus){
            showtoast(Success)
            filestatus=true;
          
        }
    }

    // Check PDF file
    if (CommonFilebtn.files.length) {
        const file = CommonFilebtn.files[0];
        if (!file.name.endsWith('.pdf')) {
            // alert("Please upload a valid PDF file.");
            Errors="<i class='bx bxs-error' ></i> Need Valid PDF File."
            showtoast(Errors)
            CommonFilebtn.value = ""; 
            filestatus=false;  
            return false;
        }
        else if(!filestatus){
            showtoast(Success)
            filestatus=true;
          
        }
       
    }   
    return true; // Validation passed
}

//onchange events for each fileuploaders
CommonFilebtn.addEventListener("change", (event)=> {handleFileInput(event, "pdf")});
ExcelFilebtn.addEventListener("change", (event)=> {handleFileInput(event, "excel")});
ImageFilebtn.addEventListener("change", (event)=> {handleFileInput(event, "image")});

//popup for file uploaders
closebtn=document.querySelector(".close");
popup=document.querySelector(".popup");

//state variables  
let currentusermsg=null;
let isgeneratingresponse=false;

const loadsavedchathistory=()=>{
    const savedconversations=JSON.parse(localStorage.getItem("saved-api-chats"))||[];
    chathistorycontainer.innerHTML='';

    requiredfiles=fileTypeConfig[savedSelection].required.join(", ").toUpperCase();
    Info=(savedSelection==='Text-to-Text')?`<i class='bx bxs-info-circle' ></i>No Files Required.`: Info=`<i class='bx bxs-info-circle' ></i>Require Files: ${requiredfiles}`;
    showtoast(Info);
    
    //iterate through saved chat history and display message
    savedconversations.forEach(conversation => {
        const usermessagehtml=`
        <div class="message--content">
            <img class="message__avatar" src="/static/images/sairam.jpg" alt="avatar">
            <p class="message--text">${conversation.userMessage}</p>
            </div>
            `;
            
            const outgoingmessageelement=createchatmessageelement(usermessagehtml,"message--outgoing");
            chathistorycontainer.append(outgoingmessageelement);
                      
            
            //api response
            const responsetext=conversation.apiResonse;
           
            parsedapiresponse=marked.parse(responsetext);
            // converts to html
            const rawapiresponse=responsetext;
            const responsehtml=` <div class="message--content">
        <img class="message__avatar" src="/static/images/favicon.png" alt="avatar">
        <p class="message--text"></p>
        <div class="cssload-loader">
	    <div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
	</div>
	<div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
	</div>
</div>
    <span class="message--icon hide" onclick="copymessagetoclipboard(this)"><i class='bx bx-copy'></i></span>
    </div>`;
            
            
            const incomingmessageelemet=createchatmessageelement(responsehtml,"message--incoming");
            chathistorycontainer.append(incomingmessageelemet);
            const messagetextelement=incomingmessageelemet.querySelector(".message--text");
            //display saved chat without typing effect
            showtypingeffect(rawapiresponse,parsedapiresponse,messagetextelement,incomingmessageelemet,true);
            //if true skips the effect
            
            
        });
        document.body.classList.toggle("hide-header",savedconversations.length>0);
    };

//create a new chat message element
const createchatmessageelement=(htmlcontent,...csssclasses)=>{
        const messageelement=document.createElement("div");
        messageelement.classList.add("message",...csssclasses);
        messageelement.innerHTML=htmlcontent;
        return messageelement;
    }

//show typing effect 
const showtypingeffect=(rawtext,htmltext,messageElement,incomingmessageelemets,skipeffect = false)=>{
        const copyiconelement=incomingmessageelemets.querySelector(".message--icon");
        copyiconelement.classList.add("hide");
        if(skipeffect)
            {
                //display directly
                messageElement.innerHTML=htmltext;
                hljs.highlightAll();
                addCopyButtonToCodeBlocks();
                copyiconelement.classList.remove("hide");
                isgeneratingresponse=false;
                return;
                
            }
    const wordarray=rawtext.split(' ');
    let wordIndex=0;
    const typingInterval=setInterval(()=>{
        messageElement.innerText+=(wordIndex===0?"":" ")+wordarray[wordIndex++];
        if(wordIndex==wordarray.length){
            clearInterval(typingInterval);
            isgeneratingresponse=false;
            messageElement.innerHTML=htmltext;
            hljs.highlightAll();
            addCopyButtonToCodeBlocks();
            copyiconelement.classList.remove("hide");
            
        }
    },75);
};

//fetch api response based on user input
const requestapiresponse=async (incomingmessageelemet)=>{
    const messagetextElement=incomingmessageelemet.querySelector(".message--text");
    const userInput=currentusermsg

            const formData = new FormData();
            formData.append("prompt--form--input", userInput);
            
    
            if (savedSelection === 'Image Agents' || savedSelection === 'RAG Applications' || savedSelection==='Excel Sheet Analyzer') {
           
            const CommonFilebtn = document.getElementById('CommonUploader');
            const ExcelFilebtn=document.getElementById("ExcelUploader");
            const ImageFilebtn=document.getElementById("ImageUploader");
            let file=null

            //checks wheather which files is given and appends it to formData
            if(CommonFilebtn.value){
                 file = CommonFilebtn.files[0];
        
            }
            if(ExcelFilebtn.value){
               file = ExcelFilebtn.files[0];
            }
            if(ImageFilebtn.value){
               file = ImageFilebtn.files[0];
            }
          
           if (file) {
                formData.append("fileUploaded", file);
            }
        }

        if (savedSelection === 'Multi Purpose Agent') {
            //for file1[pdf]
            const CommonFilebtn = document.getElementById('CommonUploader');
            const file1 = CommonFilebtn.files[0];
            if (file1) {
                formData.append("fileUploaded1", file1);
            }

            //for file2[Excel]
            const ExcelFilebtn = document.getElementById('ExcelUploader');
            const file2 = ExcelFilebtn.files[0];
            if (file2) {
                formData.append("fileUploaded2", file2);
            }
        }


        try{


            //Api response fetcing 
            const response = await fetch('/process_user_input', {
                method: 'POST',
                body: formData
            });
    
            if (response.ok) {

                // Get the response text from the server
                const responsetext = await response.text();
        
        if(!responsetext) throw new Error("Invaild api response");

        const parsedapiresponse=marked.parse(responsetext);
        const rawapiresponse=responsetext;

        showtypingeffect(rawapiresponse,parsedapiresponse,messagetextElement,incomingmessageelemet);
        
        //save conversation in localstorage
        let savedconversations=JSON.parse(
            localStorage.getItem("saved-api-chats"))||[];
            savedconversations.push(
                {
                    
                    userMessage:currentusermsg,
                    apiResonse:responsetext
                }
            );
            
            localStorage.setItem("saved-api-chats",JSON.stringify(savedconversations));
            
        }
    }
        catch (error){
            isgeneratingresponse=false;
            console.log(messagetextElement.innerText)
            console.log(error.message)
            messagetextElement.innerText=error.message;
            messagetextElement.closest(".message").classList.add("message--error");
        }
        finally{
            incomingmessageelemet.classList.remove("message--loading");
        }
    }

//add copy button to code blocks 
const addCopyButtonToCodeBlocks=()=>{
        const codeblocks=document.querySelectorAll('pre');
        codeblocks.forEach((block)=>{
            const codeelement=block.querySelector('code');
            let language=[...codeelement.classList].find(cls=>cls.startsWith('language-'))?.replace('language-','')||'Text';
            const languagelabel=document.createElement('div');
            languagelabel.innerText=language.charAt(0).toUpperCase()+language.slice(1);
            languagelabel.classList.add('code--language--label');
            block.appendChild(languagelabel);
            const copybutton=document.createElement('button');
            copybutton.innerHTML=`<i class='bx bx-copy'></i>`;
            copybutton.classList.add("code--copy-btn");
            block.appendChild(copybutton);
            
            copybutton.addEventListener('click',()=>{
                navigator.clipboard.writeText(codeelement.innerText).then(()=>{
                    copybutton.innerHTML=`<i class='bx bx-check'></i>`;
                    setTimeout(()=>copybutton.innerHTML=`<i class='bx bx-copy'></i>`,2000);
                }).catch(err=>
                    {
                        console.error('copy failed',err);
                        alert('unable to copy the text');
            }
            ) ;
        });
    });
};
//show loading animation 
const displayloadinganimation=()=>{
    const lodinghtml=`<div class="message--content">
    <img class="message__avatar" src="/static/images/favicon.png" alt="avatar">
    <p class="message--text"></p>
    <div class="cssload-loader">
	<div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
		<div class="cssload-dot"></div>
	</div>
	<div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
		<div class="cssload-dotb"></div>
	</div>
</div>
    <span class="message--icon hide" onclick="copymessagetoclipboard(this)"><i class='bx bx-copy'></i></span>
    </div>`;
    const loadingmessageelement = createchatmessageelement(lodinghtml,"message--incoming","message--loading");
   
    chathistorycontainer.appendChild(loadingmessageelement);
    
    requestapiresponse(loadingmessageelement);
};
//copy message to clipboard
const copymessagetoclipboard=(copybutton)=>{
    console.log("The copy")
    const  messagecontent =copybutton.parentElement.querySelector(".message--text").innerText;
    navigator.clipboard.writeText(messagecontent);
    copybutton.innerHTML=`<i class='bx bx-check'></i>`;
    setTimeout(() => {
        copybutton.innerHTML=`<i class='bx bx-copy'></i>`
    }, 1000);
    
}
//handle sending chat messages
const handleoutgoingmessage=()=>{
    
    currentusermsg=messageform.querySelector(".prompt--form--input").value.trim()||currentusermsg;

    if(!currentusermsg||isgeneratingresponse) return;
    isgeneratingresponse=true;
    const outgoingmessagehtml=`
    <div class="message--content">
    <img class="message__avatar" src="/static/images/sairam.jpg" alt="avatar">
    <p class="message--text"></p>
    </div>
    `;
    const outgoingmessageelement =createchatmessageelement(outgoingmessagehtml,"message--outgoing");    
    outgoingmessageelement.querySelector(".message--text").innerText=currentusermsg;
    chathistorycontainer.appendChild(outgoingmessageelement)
   
    // messageform.reset(); inputbox is cleared
    inputbox.value='';

    document.body.classList.add("hide-header");
    setTimeout(displayloadinganimation,500);
    
};
//toggle theme if needed here but not required for now

// clear all chat history

clearChatbutton.addEventListener('click',()=>
    {
        if(confirm("are you sure ?")){
         
            localStorage.removeItem("saved-api-chats");      
            //reloading the function 
            loadsavedchathistory()
            currentusermsg=null;
            isgeneratingresponse=false;
            
        };
        
    });
    
//Evenlisten for Enter keyword
inputbox.addEventListener('keydown',(event)=>{
        if(event.key==='Enter'){
            if(inputbox.value===''){
                Warning="<i class='bx bxs-binoculars'></i>Enter some Prompt"
                showtoast(Warning)
            }
            if(inputbox.value && popup.classList.contains("show")){
                filelinker.click();
                filelinker.classList.remove("pointno")
            }
            allowed=validateUploads();
            if(allowed){handleoutgoingmessage();}
        }
    });
//Onclick for send button
sendbutton.onclick=()=>{
       
    if(inputbox.value && popup.classList.contains("show")){
        filelinker.click();
        filelinker.classList.remove("pointno")
    }
        allowed=validateUploads();
        if(allowed){handleoutgoingmessage();}
} 

//Onclick for filelinker button
filelinker.onclick=()=>{
        popup.classList.toggle("show");
        filelinker.classList.add("pointno");
       
} 

//file popup close button
closebtn.onclick=()=>{
        filelinker.click();
        filelinker.classList.remove("pointno")

}

//event listener for onload

window.addEventListener("load", function () {
    //storing the previousagent_name and current_name to work with loading history
    let previousAgent = localStorage.getItem("previousAgent");  
    let currentAgent = localStorage.getItem("Name_of_agent"); 

    if (previousAgent && previousAgent !== currentAgent) {
        //if new agent was selcted removing the chat history of previous agent from storage
        localStorage.removeItem("saved-api-chats");      
        
    }
    else{
        //if same agent then load saved history
        loadsavedchathistory()
    }

    localStorage.setItem("previousAgent", currentAgent); 
});
