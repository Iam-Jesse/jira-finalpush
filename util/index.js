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
