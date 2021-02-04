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
      .catch(error => {
        //handle error
        console.error(error);
      });
};

export const contentize = (content) => {
  let contentArray = [];
  
  contentArray = content.split('\r\n')
  .filter(result => {
    return(result.trim() !== '');
  })
  .map(result => {
    return result.trim();
  });
  
  return objectify(contentArray);
};

export const structureIssueDbEntry = (customIDs, issueFields) => {
    let field_and_content = [];
    customIDs.forEach(customID => {
        if(issueFields[customID] != null && typeof(issueFields[customID]) === 'string'){
            field_and_content.push({customID: customID.split('_')[1], 
                content: contentize(issueFields[customID])
            });
        }else if(issueFields[customID] === null){
          field_and_content.push({customID: customID.split('_')[1], 
                content: ''
            });
        };
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

export const postComment = (issueId, title, displayName, view) => {

  let message = (view === 'customer') ? `${displayName} wants to reset ${title}.` : `${displayName} approved your request.`;

    const bodyData = `{
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
              {
                "type": "paragraph",
                "content": [
                  {
                    "text": "${message}",
                    "type": "text"
                  }
                ]
              }
            ]
          }
      }`;
    request.post(`/issue/${issueId}/comment`, bodyData)
    .catch(error => {
        //handle error
        console.log(error);
    })
};

export const getSLA = (issueId) => {
  //change the base URL before production
  return request.get(`https://jessite.atlassian.net/rest/servicedeskapi/request/${issueId}/sla`)
  .catch(error => {
    //handle error
    console.log(error);
  });
}
