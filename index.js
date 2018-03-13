// Example express application adding the parse-server module to expose Parse
// compatible API routes.

var express = require('express');
var ParseServer = require('parse-server').ParseServer;
var path = require('path');
const morgan = require('morgan');
const S3Adapter = require('@parse/s3-files-adapter');


var databaseUri = process.env.DATABASE_URI || process.env.MONGODB_URI;
if (!databaseUri) {
  console.log('DATABASE_URI not specified, falling back to localhost.');
}


// |publicServerURL| needs to declare specific IP for localhost
// 'http://192.168.1.3:1337/parse' instead of 'http://localhost:1337/parse'
// in case you run iOS or Android app on localhost
const localhost = 'http://localhost:1337/parse';


// Configure s3 Adapter
// Use the last form, s3overrides are the parameters passed to AWS.S3
const s3Options = {
  "bucket": process.env.S3_BUCKET || "dev-stryde-document-download",
  // optional:
  "region": process.env.S3_REGION || 'us-east-1', // default value
  "bucketPrefix": '', // default value
  "directAccess": true, // default value
  "baseUrl": null, // default value
  "signatureVersion": 'v4', // default value
  "globalCacheControl": 'public, max-age=86400'  // 24 hrs Cache-Control.
}
const s3Adapter = new S3Adapter(s3Options);


var api = new ParseServer({
  databaseURI: databaseUri || 'mongodb://localhost:27017/stryde-document-download-dev',
  cloud: process.env.CLOUD_CODE_MAIN || __dirname + '/cloud/main.js',
  appId: process.env.APP_ID || 'myAppId',
  masterKey: process.env.MASTER_KEY || 'myMasterKey', //Add your master key here. Keep it secret!
  restAPIKey: process.env.REST_API_KEY || 'myRestAPIKey',
  javascriptKey: process.env.JAVASCRIPT_KEY || 'myJavaScriptKey',
  clientKey: process.env.CLIENT_KEY || 'myClientKey',
  fileKey: process.env.FILE_KEY || 'myFileKey',
  serverURL: process.env.SERVER_URL || localhost,  // Don't forget to change to https if needed
  liveQuery: {
    classNames: ["Posts", "Comments"] // List of classes to support for query subscriptions
  }
});
// Client-keys like the javascript key or the .NET key are not necessary with parse-server
// If you wish you require them, you can set them as options in the initialization above:
// javascriptKey, restAPIKey, dotNetKey, clientKey

const app = express();

// Serve static assets from the /public folder
app.use('/public', express.static(path.join(__dirname, '/public')));

// morgan middleware
app.use(morgan('dev'));           // log every request to the console

// Serve the Parse API on the /parse URL prefix
const mountPath = process.env.PARSE_MOUNT || '/parse';
app.use(mountPath, api);

// Parse Server plays nicely with the rest of your web routes
app.get('/', function(req, res) {
  res.status(200).send('I dream of being a website.  Please star the parse-server repo on GitHub!');
});

// There will be a test page available on the /test path of your server url
// Remove this before launching your app
app.get('/test', function(req, res) {
  res.sendFile(path.join(__dirname, '/public/test.html'));
});

const port = process.env.PORT || 1337;
const httpServer = require('http').createServer(app);
httpServer.listen(port, function() {
    console.log('Parse server running on port ' + port + '.');
});

// This will enable the Live Query real-time server
ParseServer.createLiveQueryServer(httpServer);
