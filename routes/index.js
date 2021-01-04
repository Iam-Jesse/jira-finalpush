import {createDbEntry, addFieldContent_Db} from '../util';
import {IssueTab} from '../models/Model';

export default function routes(app, addon) {
    // Redirect root path to /atlassian-connect.json,
    // which will be served by atlassian-connect-express.
    // app.get('/', (req, res) => {
    //     res.redirect('/atlassian-connect.json');
    // });
    
    createDbEntry('From Glitch', '');
    createDbEntry('Hey Glitches', '');

    // This is an example route used by "generalPages" module (see atlassian-connect.json).
    // Verify that the incoming request is authenticated with Atlassian Connect.
    app.get('/hello-world', addon.authenticate(), (req, res) => {
        // Rendering a template is easy; the render method takes two params: the name of the component or template file, and its props.
        // Handlebars and jsx are both supported, but please note that jsx changes require `npm run watch-jsx` in order to be picked up by the server.
        res.render(
          'hello-world.hbs', // change this to 'hello-world.jsx' to use the Atlaskit & React version
          {
            title: 'Atlassian Connect'
            //, issueId: req.query['issueId']
            //, browserOnly: true // you can set this to disable server-side rendering for react views
          }
        );
    });

    app.post('/webhooks', (req) => {
      addFieldContent_Db(req.body.issue)
    });

    app.get('/issue/:issueId', (req, res) => {
      console.log('This is the issue id',req.params.issueId);
      IssueTab.find({issueId: req.params.issueId}).populate('ownerField').lean().exec()
      .then(result => {
          if(result.length > 0){
            res.render('issue-view.hbs', {result});
          }else{
            return;
          }
      });
    });

    app.get('/request/:issueId', (req, res) => {
      console.log('This is the issue id',req.params.issueId);
      IssueTab.find({issueId: req.params.issueId}).populate('ownerField').lean().exec()
      .then(result => {
          if(result.length > 0){
            res.render('issue-view.hbs', {result, id: req.params.issueId});
          }else{
            return;
          }
      });
    });

    app.post('/issue/:id', (req) => {
      console.log(req.params.id);
      console.log(req.body);
      IssueTab.find({'fieldContent._id': {$in: req.body.value}})
      .then(res => console.log(res))
      .catch(error => {
        //handle error
        console.log(error);
      });
    });

    // Add additional route handlers here...
}
