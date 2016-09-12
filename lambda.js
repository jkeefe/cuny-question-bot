var questionbot = require('./index');
var ApiBuilder = require('claudia-api-builder');
var api = new ApiBuilder();

module.exports = api;

var cookie_to_send;

api.post('/question-bot', function(request){
  // bulding the reply (repsonse)
  // which first sends the request object to question-bot for processing
  return questionbot(request)
  
    // wait for the Promise object to come back from question-bot
    .then(function(response){
        
        console.log("Fufilled promise: ", response);
      
      // send the response back to the requester (Twilio)
      // return response.message;
      
      // using claudia-api-builder custom headers
      // from: https://github.com/claudiajs/claudia-api-builder/blob/master/docs/api.md
      return new api.ApiResponse(
          response.message, 
          {
              'Set-Cookie': response.cookie
          });
      
    });
  }, {
    // this optional 3rd argument changes the format of the response, for twilio 
    success: { contentType: 'application/xml', headers: ['Set-Cookie'] },
    error: { contentType: 'application/xml' }
});