import {createDbEntry, addFieldContent_Db, enableEdit, getApprovalStatus, getStatus, deleteIssue, fetchSLA, getIssueStatus} from '../util';
import {Checkable, IssueTab} from '../models/Model';
import {body, validationResult} from 'express-validator';

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
    app.get('/inputs', addon.authenticate(), (req, res) => {
      // Rendering a template is easy; the render method takes two params: the name of the component or template file, and its props.
      // Handlebars and jsx are both supported, but please note that jsx changes require `npm run watch-jsx` in order to be picked up by the server.

      //checkable.find by user site
      Checkable.find({}).lean()
      .then(result => {
        if(result.length > 0){
          res.render('input-settings', {result});
        }else{
          res.send('No fields registered!')
        }
      });
    });

    app.post('/inputs', 
    body('title').trim().whitelist(allowedCharacters).escape().isLength({ min: 1 }),
    body('description').trim().whitelist(allowedCharacters).escape().isLength({ min: 1 }),
    (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        //handle error
        return res.status(400).send('Invalid Input');
      }
      console.log(req.body);

      if(req.body.id !== ''){
        Checkable.findById(req.body.id)
        .then(result => console.log('This is the hidden id field', result));
        //createDbEntry(req.body.title, req.body.description);
      }
    });

    app.post('/issue-created', (req, res) => {
      addFieldContent_Db(req.body.issue)
    });

    app.post('/issue-deleted/:id', (req, res) => {
      deleteIssue(req.params.id);
    });

    app.get('/issue/:issueId', (req, res) => {
      let approvalStatus;

      IssueTab.find({issueId: req.params.issueId}).lean().exec()
      .then(result => {
        console.log(result);
          if(result.length > 0){
            approvalStatus = getApprovalStatus(result);
            res.render('issue-view.hbs', {result, id: req.params.issueId, approvalStatus});
          }else{
            //handle error
            return;
          }
      });
    });

    app.get('/request/:issueId', (req, res) => {
      let attachments = [];
      let approvalStatus, fieldStatus;
      let closed = false;

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

          console.log('This is the issue id',req.params.issueId);
          console.log('this is the closed variable', closed);

          IssueTab.find({issueId: req.params.issueId}).lean().exec()
          .then(result => {
              if(result.length > 0){
                approvalStatus = getApprovalStatus(result);
                fieldStatus = getStatus(result);
                console.log('this is the fieldStatus', fieldStatus);
                res.render('request-view.hbs', {result, id: req.params.issueId, approvalStatus, closed, fieldStatus, attachments});
              }else{
                //handle empty output
                return;
              }
          });
      });
    });

    app.get('/request/:issueId/right', (req, res) => {
      fetchSLA(req.params.issueId, res);
    });

    app.post('/issue/:id', (req, res) => {
      
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

    app.post('/issue/:id/edit', (req, res) => {
      enableEdit(req.body.user, req.params.id, req.body.title, res, 'customer');
    });

    app.post('/issue/:id/approve', (req, res) => {
      enableEdit(req.body.user, req.params.id, req.body.title, res, 'approved');
    });

    // Add additional route handlers here...
}
