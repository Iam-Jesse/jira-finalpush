import async from 'async';

import {Checkable, IssueTab} from '../models/Model';
import {createCustomField, structureIssueDbEntry, objectify, getCustomIDs} from './input';

export const createDbEntry = (title, description) => {
    createCustomField(title, description).then(({data:{schema: {customId}}}) => {
        Checkable.create({customId, title, description})
            .then(res => console.log(res))
            .catch(error => {
                //handle error
                console.log(error);
        })
    });
};

export const addFieldContent_Db = (issue) => {
    const customIDs = getCustomIDs(issue.fields);
    let fields_and_content;
    const customIDsINeed = [];
    Checkable.find({customId: {$in: customIDs}})
    .then(res => {
        if(!res.length > 0){
            return;
        }else{
            res.forEach(result => {
                customIDsINeed.push(`customfield_${result.customId}`);
            });
            fields_and_content = structureIssueDbEntry(customIDsINeed, issue.fields);
            async.forEach(fields_and_content, ({customID, content}) => {
                Checkable.findOne({customId: customID})
                .then(res => {
                    if(Object.entries(res).length > 0){
                        IssueTab.create({issueId: issue.id, fieldContent: content, ownerField: res._id, ownerTitle: res.title})
                        .then(created => {
                            res.issue.push(created._id);
                            res.save()
                            .then(()=>{
                                console.log('this is the created issue: ',created);
                                console.log('this is the updated checkable',res);
                            });
                        });
                    }
                }); 
            }, (err) => {
                //handle error
                if(err){
                    console.log(err);
                }
            });
        }
    })
    .catch(error => {
        //handle error
        console.log(error);
    });
};

export const outputAfterSaved = (resultArray, id) => {
  let htmlContent = `<div style="margin: 0px 15px; overflow: hidden"><form action="/issue/${id}" method="POST" id="custom-form">`;
      resultArray.forEach(eachIssue => {
        htmlContent += `<h3 class="headers">${eachIssue.ownerTitle}</h3>`;
        eachIssue.fieldContent.forEach(eachFieldContent => {
          htmlContent += `<div>
                    <input type="checkbox" name="value" value="${eachFieldContent._id}">
                    <label for="value" class="normal-text">${eachFieldContent.value}</label>
                </div>`;
        });
      });
      htmlContent += `<input type="hidden" value="${id}" id="hidden-input">
      <button type="submit" class="aui-button aui-button-primary all-buttons">Save</button></form></div>`;
  return htmlContent;
};
