import request from './request';

// const getIssueFields = () => {
//     request.get('field').then(res => {
//         res.data.forEach(field => {
//             console.log(field.name);
//         });
//     })
//     .catch(error => console.log(error));
// };

export const createCustomField = (name, description) => {
    //supply db name and description
    const bodyData = `{
        "searcherKey": "com.atlassian.jira.plugin.system.customfieldtypes:textsearcher",
        "name": "${name}",
        "description": "${description}",
        "type": "com.atlassian.jira.plugin.system.customfieldtypes:textarea"
      }`;
  
      return request.post('/field', bodyData)
      .then(()=>{console.log('created a new field')})
      .catch(error => {
        //handle error
        console.error(error);
      });
};

export const structureIssueDbEntry = (customIDs, issueFields) => {
    let field_and_content = [];
    customIDs.forEach(customID => {
        if(issueFields[customID] != null && typeof(issueFields[customID]) === 'string'){
            field_and_content.push({customID: customID.split('_')[1], 
                content: issueFields[customID].split('\r\n')
                .filter(result => {
                  console.log('result', typeof(result));
                  return(result.trim() !== '');
                })
                .map(result => {
                  console.log('This is from the map function', result)
                  return result.trim();
                })
            });
        };
        });

    field_and_content.map(element=>{
        return [... element.content = objectify(element.content)];
    });
        
    return field_and_content;
};

export const objectify = (arrayData) => {
    let newArray = [];
    arrayData.forEach(arrayDatum => {
        newArray.push({value: arrayDatum});
    });
    return newArray;
};

export const getCustomIDs = (fields) => {
    //get each issue field key
    const customIDs = [];
    const issueFieldKeys = Object.keys(fields).filter(key => {
        return key.includes('customfield');
    });
    issueFieldKeys.forEach(issue => {
        customIDs.push(issue.split('_')[1]);
    });

    return customIDs;
};

export const outputAfterSaved = (resultArray) => {
  let htmlContent = '<div class="wrapper"><form action="/issue/{{id}}" method="POST" id="custom-form">';
      resultArray.forEach(eachIssue => {
        htmlContent += `<h3 class="headers">${eachIssue.ownerTitle}</h3>`;
        eachIssue.fieldContent.forEach();
      });
      '<input type="hidden" value="{{id}}" id="hidden-input">'+
      '<button type="submit" class="aui-button aui-button-primary all-buttons">Save</button></form></div>';
};
