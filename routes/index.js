import {createDbEntry, addFieldContent_Db, enableEdit, getApprovalStatus, getStatus, deleteIssue, fetchSLA, getIssueStatus, updateIssueDb} from '../util';
import {Checkable, IssueTab, User} from '../models/Model';
import {body, validationResult} from 'express-validator';
import mongoose from 'mongoose';

export default function routes(app, addon) {
    const allowedCharacters = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      ' ',
      ',.'
    ]
    // Redirect root path to /atlassian-connect.json,
    // which will be served by atlassian-connect-express.
    // app.get('/', (req, res) => {
    //     res.redirect('/atlassian-connect.json');
    // });
    

    // This is an example route used by "generalPages" module (see atlassian-connect.json).
    // Verify that the incoming request is authenticated with Atlassian Connect.
    app.get('/inputs', (req, res) => {
      // Rendering a template is easy; the render method takes two params: the name of the component or template file, and its props.
      // Handlebars and jsx are both supported, but please note that jsx changes require `npm run watch-jsx` in order to be picked up by the server.

      //checkable.find by user site
      mongoose.connection.db.listCollections({name: 'checkables'})
      .next(function(err, collinfo) {
          if (collinfo) {
            Checkable.find({}).lean()
            .then(result => {
              if(result.length > 0){
                res.render('input-settings', {result, empty: false});
              }else{
                res.render('input-settings', {empty: true});
              }
            });
          }else{
            res.render('input-settings', {empty: true});
          }
      });
    });

    app.post('/inputs', addon.checkValidToken(),
    body('title').trim().whitelist(allowedCharacters).escape().isLength({ min: 1 }),
    body('description').trim().whitelist(allowedCharacters).escape(),
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //handle error
        return res.status(400).send('Invalid Input');
      }
      console.log(req.body);      
      createDbEntry(req.body.title, req.body.description, res);
    });
  
    app.delete('/inputs', addon.checkValidToken(), (req, res) => {
      console.log(req.body);
      
      Checkable.findOne({_id: req.body._id})
      .then((result) => {
        if(result){
          IssueTab.deleteMany({_id: {$in: result.issues}})
          .then(deleted => {
            console.log('all gone');
            console.log(deleted);
            result.deleteOne()
            .then(()=>{
              res.send({deleted: true});
            });
        })
        }
      })
      .catch(error => {
        //handle error
        console.log(error);
      });
    });
  
    app.post('/preferences', addon.checkValidToken(), (req, res) => {
      console.log(req.body);
      User.updateOne({}, {userPreferences: req.body})
      .then(result => {
        console.log(result);
        //handle success
        res.send('User Preferences Added Successfully');
      });
    });
  
    app.get('/issue/:issueId', (req, res) => {
      let approvalStatus = false;
      let empty = false;
      
      console.log(req);
      
      mongoose.connection.db.listCollections({name: 'issuetabs'})
      .next(function(err, collinfo) {
        console.log(collinfo);
          if (collinfo) {
              IssueTab.find({issueId: req.params.issueId}).lean().exec()
              .then(result => {
                console.log(result);
                  if(result.length > 0){
                    approvalStatus = getApprovalStatus(result);
                    result.forEach((requested) => {
                      if(requested.approvalRequest && requested.approvalRequest === true){
                        approvalStatus = true;
                      }
                      if((!requested.fieldContent.length > 0) || (requested.fieldContent.length === 1 && typeof(requested.fieldContent[0]) === 'string')){
                        requested.fieldContent[0] = null;
                        empty = true;
                      }
                    });
                    res.render('issue-view.hbs', {result, id: req.params.issueId, approvalStatus, empty, noCollection: false});
                  }else{
                    console.log('I reach here');
                    res.render('issue-view.hbs', {noCollection: true});
                  }
              })
              .catch(() => {
                //handle error
              });
          }else{
            res.render('issue-view.hbs', {noCollection: true});
          }
      });
    });

    app.post('/issue', addon.checkValidToken(), (req, res) => {
      addFieldContent_Db(req.body.issue)
    });
  
    app.put('/issue', addon.checkValidToken(), (req, res) => {
      console.log('I got here');
      console.log(req.body);
      updateIssueDb(req.body.issueId, req.body.ownerField, req.body.description, res);
    });
    
    app.delete('/issue/:issueId', addon.checkValidToken(), (req, res) => {
      deleteIssue(req.params.issueId);
    });

    app.get('/request/:issueId', (req, res) => {
      let attachments = [];
      let approvalStatus, fieldStatus, closed, empty, allFieldsNotEmpty, allEmpty;
      approvalStatus = fieldStatus = closed = empty = allFieldsNotEmpty = allEmpty = false;
      let attached;
      
//       User.find({}).populate('issues').lean()
//       .then(found => {
//         if(found.length > 0){
          
//         }else{
//           //handle error
//           return;
//         }
//       })
      
      mongoose.connection.db.listCollections({name: 'issuetabs'})
      .next(function(err, collinfo) {
          if (collinfo) {
              getIssueStatus(req.params.issueId)
              .then(({data:{fields:{status:{statusCategory:{colorName}}, attachment}}}) => {
                  if(colorName === 'green'){
                    closed = true;
                  }
                  //if attachment is checked or not empty
                  if(attachment.length > 0){
                    attachment.forEach(({thumbnail, content, filename}) => {
                      attachments.push({thumbnail, content, filename});
                    });
                  }

                  attached = !!attachments.length;

                  IssueTab.find({issueId: req.params.issueId}).lean().exec()
                  .then(result => {
                      if(result.length > 0){

                        result.forEach((requested) => {
                          if(requested.approvalRequest && requested.approvalRequest === true){
                            approvalStatus = true;
                          }
                          if((!requested.fieldContent.length > 0) || (requested.fieldContent.length === 1 && typeof(requested.fieldContent[0])=== 'string')){
                            requested.fieldContent[0] = null;
                            empty = true;
                          }else{
                            allFieldsNotEmpty = true;
                            requested.fieldContent.forEach(field => {
                              if(field.status === true){
                                fieldStatus = true;
                              }
                            });
                          }
                        });

                        if(empty && !allFieldsNotEmpty){
                          allEmpty = true;
                        }

                        res.render('request-view.hbs', {result, id: req.params.issueId, approvalStatus, closed, fieldStatus, attachments, attached, empty, allEmpty, noCollection: false});
                      }else{
                        res.render('request-view.hbs', {noCollection: true});
                      }
                  });
              })
              .catch(() => {
                //handle error
              });
          }else{
            res.render('request-view.hbs', {noCollection: true});
          }
      });
    });

    app.get('/request/:issueId/right', (req, res) => {
      fetchSLA(req.params.issueId, res);
    });

    app.post('/request/:id', addon.checkValidToken(), (req, res) => {
      
      console.log(req.params.id);
      console.log('This is the request body', req.body);
      console.log(req.body);
      
      IssueTab.updateMany({'fieldContent._id': {$in: req.body.value}}, 
                          {$set: {"fieldContent.$[elem].status": true}},
                         {
                           upsert: false,
                           arrayFilters: [{'elem._id': {$in: req.body.value}}]
                          })
      .then(() => {
        res.send(req.body.value);
      })
      .catch(error => {
        //handle error
        console.log(error);
      });
    });

    app.put('/request/:id', addon.checkValidToken(), (req, res) => {
      console.log('Are you trying to edit issues', req.body);
      enableEdit(req.body.user, req.params.id, req.body.title, res, 'customer');
    });

    app.post('/issue/:id/approve', addon.checkValidToken(), (req, res) => {
      enableEdit(req.body.user, req.params.id, req.body.title, res, 'approved');
    });

    // Add additional route handlers here...
}
