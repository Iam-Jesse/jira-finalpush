const baseUrl = document.getElementsByTagName('meta')[2].content;

function issueView() {
  const id = document.querySelector('#hidden-input').value;
  const url = `${baseUrl}/issue/${id}/approve`;
  const approvalDisplay = document.querySelector('#approvalDisplay');
  
  AP.user.getCurrentUser(function({atlassianAccountId}) {
    fetcher(url, JSON.stringify({user:atlassianAccountId}))
    .then(() => {
      approvalDisplay.style.display = "none";
    })
  });
}

function requestViewSubmit(e){
  const id = document.querySelector('#hidden-input').value;
  const url = `${baseUrl}/request/${id}`;

  const checkStatus = document.querySelector('#checkStatus');
  const checkboxes = document.querySelectorAll('input[type=checkbox]');
  let allInputs = [];
  
  e.preventDefault();
    // console.log(formElems);
    
    for (let checkbox of checkboxes) {
      if(checkbox.checked && !checkbox.disabled){
        allInputs.push(checkbox.value);
      }
    }
    
    console.log(allInputs);

    if(allInputs.length > 0){
      fetcher(url, JSON.stringify({value: allInputs}))
      .then(data => {
        allInputs = [];
        console.log(data);
        data.forEach(issueResult => {
        document.querySelector(`input[value="${issueResult}"]`).disabled = true;
          if(!checkStatus){
            document.querySelector('#resetButton').style.display = "inline-block";
          }
      });
    })
    .catch(error=> {
      //handle error
      console.log(error);
    });
    }else{
      return;
    }
}

function requestViewReset(){
  const approvalDisplay = document.querySelector('#approval');
  const title = document.querySelector('h3').innerText;
  const id = document.querySelector('#hidden-input').value;
  const url = `${baseUrl}/request/${id}?_method=PUT`;
  const resetButton = document.querySelector('#resetButton');
  
  AP.user.getCurrentUser(function({atlassianAccountId}) {
    fetcher(url, JSON.stringify({title, user:atlassianAccountId}))
    .then(({approvalRequested}) => {
      if(approvalRequested){
        console.log(approvalRequested);
        if(!approvalDisplay){
          document.querySelector('#approvalHidden').style.display = "block";
          resetButton.disabled = true;
        }
      }
    })
  });
}

function deleteField (_id) {
  const id = document.getElementById(_id);
  const url = `${baseUrl}/inputs?_method=DELETE`;
  
  let confirmation = confirm("Deleting this field would delete all issues related to this field!\n\nNote: This action does not delete the field in Jira, you still have to delete this yourself.");
  if (confirmation == true) {
    fetcher(url, JSON.stringify({_id}))
    .then((data) => {
      console.log(data);
      id.parentElement.parentElement.style.display = 'none';
    });
  } else {
    return;
 }
}

function fetcher (url, body) {
  let factor = document.getElementsByTagName('meta')[2].content;
  
  console.log('factor', factor);
  
  return fetch(url, {
  method: 'POST',
  headers: {
    "Authorization": `JWT ${factor}`,
    "Content-Type": "application/json"
  }, 
  body: body
  })
  .then(response => {
    if(response.ok){
    return response.json();
    }
  });
}