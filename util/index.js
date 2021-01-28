import async from 'async';

import request from './request';
import {Checkable, IssueTab} from '../models/Model';
import {createCustomField, structureIssueDbEntry, getCustomIDs, postComment, getSLA} from './input';

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

export const updateDbFieldDetials = (title, description, _id) => {    
    Checkable.find({_id})
        .then(res => {
            re
        })
        .catch(error => {
            //handle error
            console.log(error);
    });
};

export const enableEdit = (userId, issueId, title, res, view) => {
    let userObj;

    request.get(`/user?accountId=${userId}`)
    .then(({data: {accountId, emailAddress, displayName}}) => {
        userObj = {
            timestamp: Date.now(),
            userId: accountId,
            email: emailAddress,
            displayName
        }

        postComment(issueId, title, displayName, view);

        if(view === 'customer'){
            IssueTab.findOne({issueId})
            .then(found => {
                console.log(found);
                console.log(!found);
                if (found){
                    found.approvalRequest = true; 
                    found.editor.push(userObj);
                    found.save()
                    .then(res.send({approvalRequested: true}));
                }else{
                    //handle error
                    return;
                }
            });
        }else if(view === 'approved'){
            IssueTab.updateMany({issueId}, 
                          {approvalRequest: false, $push: {approver: userObj}, 'fieldContent.$[].status': false},
                         {
                           multi: true
                          })
            .then((updated) => {
                console.log(updated);
                res.send({approvalRequested: false});
            })
            .catch(error => {
                //handle error
                console.log(error);
            });
        }
    })
    .catch(error => console.log(error));
}

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
                        IssueTab.updateOne({issueId: issue.id, ownerField: res._id, ownerTitle: res.title},
                            {issueId: issue.id, fieldContent: content, ownerField: res._id, ownerTitle: res.title},
                            {upsert: true}
                        )
                        .then(res => console.log('I just added this to database', res));
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

export const getApprovalStatus = (arr) => {
    let approvalStatus = false;
    arr.forEach(issue => {
        if(issue.approvalRequest === true){
            console.log('This is the approval status', issue.approvalRequest);
            approvalStatus = true;
        }
    });
    return approvalStatus;
}

export const getStatus = (arr) => {
    let status = false;
    arr.forEach(issue => {
        issue.fieldContent.forEach(field => {
            if(field.status === true){
                console.log('This is the status', field.status);
                status = true;
            }
        });
    });
    return status;
}

export const deleteIssue = (issueId) => {
    IssueTab.deleteMany({issueId})
    .catch(error => {
        //handle error
        console.log(error);
    });
};

export const getIssueStatus = (issueId) => {
    return request.get(`/issue/${issueId}?fields=status,priority,attachment`)
    .catch(error => {
      //handle error
      console.log(error);
    })
};

export const fetchSLA = (issueId, res) => {
    let allSLA = [];
    
    getIssueStatus(issueId)
    .then(({data:{fields: {priority: {name}}}}) => {
      getSLA(issueId)
      .then(result => {
        let datum = result.data.values;
  
        for (let i = 0; i < datum.length; i++) {
          let eachSLA = {};
  
          eachSLA.name = datum[i].name;
          eachSLA.goal = (datum[i].ongoingCycle) ? datum[i].ongoingCycle.goalDuration.friendly : 'Unspecified';
          eachSLA.remainingTime = (datum[i].ongoingCycle) ? datum[i].ongoingCycle.remainingTime.friendly : '';
          allSLA.push(eachSLA);
  
        }
        allSLA = allSLA.filter(eachSLA => eachSLA.goal !== 'Unspecified');
        console.log(allSLA);
        return res.render('request-right-view', {allSLA, priority:name});
      });
    });
  }
  