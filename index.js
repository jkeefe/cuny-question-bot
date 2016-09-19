// question-bot!

var twilio = require('twilio');
var http_request = require('request');
var randomstring = require("randomstring");

// hard-code the questions here
var question_list = [
    
    // Example format ...
    
    // {"answered_cookie": "first", 
    // "response": {
    //     "english":"This is english Question A",
    //     "spanish":"This is spanish question A"
    //     }, 
    // "set_cookie": "a"},  // <- set_cookie must match THIS question
    // 
    // {"answered_cookie": "a", // <- answered_cookie must match the LAST question
    // "response": {
    //     "english":"This is english Question B",
    //     "spanish":"This is spanish question B"
    //     }, 
    // "set_cookie": "b"},

    {"answered_cookie": "first", 
    "response": {
        "english":"Thanks for taking our quick survey! On a scale of 1-5, how do you rate your relationship to the police? (1=Respectful, 5=Hostile)",
        "spanish":"Gracias por participar en nuestra encuesta. ¿Cómo respondería en la escala del 1 al 5, cómo califica su relación con la policía? (1=Respetuoso, 5=hostil)"
        }, 
    "set_cookie": "relationship"},
    
    {"answered_cookie": "relationship", 
    "response": {
        "english":"On a scale of 1-5, how do you feel about the statement: The NYPD is a threat to my safety? (1=Strongly disagree, 5=Strongly agree)",
        "spanish":"¿Cómo respondería en la escala del 1 al 5, el Departamento de Policía es una amenaza para mi seguridad? (1=muy en desacuerdo, 5=muy de acuerdo)"
        }, 
    "set_cookie": "safety"},

    {"answered_cookie": "safety", 
    "response": {
        "english":"Have you ever seen a police officer use unjustified force in your community? REPLY Yes or No",
        "spanish":"¿Alguna vez ha visto a un agente de la policía usar fuerza injustificada en su comunidad? RESPONDA Sí o No"
        }, 
    "set_cookie": "force"},
    
    {"answered_cookie": "force", 
    "response": {
        "english":"On a scale of 1-5, how do you feel about the statement: Police unfairly target young black & latino people in my neighborhood? (1=Strongly disagree 5=Strongly Agree)",
        "spanish":"¿Cómo respondería en la escala del 1 al 5, policía se enfoca injustamente en jóvenes negros y latinos en mi vecindario?(1=muy en desacuerdo, 5=muy de acuerdo)"
        }, 
    "set_cookie": "target"},

    {"answered_cookie": "target", 
    "response": {
        "english":"How many pink slip summonses have you received?",
        "spanish":"¿Citaciones penales, cuántos has recibido?"
        }, 
    "set_cookie":"summons"},
    
    {"answered_cookie": "summons", 
    "response": {
        "english":"How old are you? REPLY (ex. 12, 50, 27, etc)",
        "spanish":"¿Cuántos años tiene? RESPONDA (por ejemplo 12, 50, 27)"
        }, 
    "set_cookie":"age"},
    
    {"answered_cookie": "age", 
    "response": {
        "english":"What is your race? REPLY (ex. Black, White, Latino, etc)",
        "spanish":"¿Cuál es su raza? RESPONDA: Como ejemplo puede usted responder negro, latino, etc"
        }, 
    "set_cookie": "race"},
    
    {"answered_cookie": "race", 
    "response": {
        "english":"What is your gender? REPLY (ex.Man, Woman etc)",
        "spanish":"¿Cuál es su género? RESPONDA: Como ejemplo puede usted responder mujer, hombre, etc"
        }, 
    "set_cookie": "gender"},
    
    {"answered_cookie": "gender", 
    "response": {
        "english":"Almost done! Can we contact you? REPLY Yes or No",
        "spanish":"¡Ya casi terminamos! ¿Podemos contactarlo? RESPONDA Sí o No."
        }, 
    "set_cookie": "contact"},
    
    {"answered_cookie": "contact", 
    "response": {
        "english":"What can the police do to rebuild trust amongst residents?",
        "spanish":"¿Qué puede hacer la policía para ganar de nuevo la confianza de la comunidad?"
        }, 
    "set_cookie": "trust"},

     {"answered_cookie": "trust", 
    "response": {
        "english":"Please share this survey with others in East Harlem! If you have questions please call/text 347-469-0881 Thank you!",
        "spanish":"Por favor comparta esta encuesta con otros residentes de El Barrio. Si tiene preguntas, por favor llame al 347-469-0881 ¡Muchas gracias!"
        }, 
    "set_cookie": "done"}  
];

module.exports = function(request) {
  
  return new Promise(function(fulfill, reject){

      // console.log("Incoming request: ", request);

      // Is there a text body? Error out if not.
      if(!request.post) {
        request.send("Sorry. I don't understand that.");
        console.log("No body to received text.");  
      }
      
      var text_body = request.post.Body;
      var texter = request.post.From;
      var sent_to_phone = request.post.To;
      var language;

      // these are set in the amazon API Gateway (in stage variables) and passed by lambda
      var spreadsheetURL = request.env.GOOGLE_SS_URL;
      var spanish_phone_number = request.env.SPANISH_NUMBER;

      // if there are no cookies yet, make the question cookie "first"
      if (!request.headers.Cookie) {
          texters_cookie = "first";
          
          // and set up a new id cookie the same caller
          id_cookie = randomstring.generate({
              length: 7,
              charset: 'alphabetic',
              capitalization: 'lowercase'
          });

      // otherwise, extract the part after the 'question='
      // ... so 'test' from 'question=test' ...
      // using a regular expression
      } else {
          // the next line will return 'null' if no match,
          // or an array of details if there is a match
          matching_try = request.headers.Cookie.match(/question=(\w+)/i);
          
          // we have a cookie, is it a "question=" cookie?
          if (!matching_try) {
              // there was no match on "question=xxx"
              texters_cookie = "first";
          } else {
              // there was a match, and the cookie text is element [1]
              texters_cookie = matching_try[1];
          }
          
          matching_try_id = request.headers.Cookie.match(/id=(\w+)/i);
          
          // we have a cookie, is it a "id=" cookie?
          if (!matching_try_id) {
              // there was no match on "id=xxx"
              // so generate a new id cookie
              id_cookie = randomstring.generate({
                  length: 7,
                  charset: 'alphabetic',
                  capitalization: 'lowercase'
              });
              
          } else {
              // there was a match, and the cookie text is element [1]
              id_cookie = matching_try_id[1];
          }
          
          
      }
      
      // someone sending "clear" as a text resets the cookie process
      // (mainly for testing, not for end-users)
      if (text_body.trim().toLowerCase() == "clear") {
          texters_cookie = "first";
      }
      
      // loop through all of the questions ... 
      for (var i = 0; i < question_list.length; i++) {
        
          // ... until we find a cookie matching the one sent with the text
          if (question_list[i].answered_cookie == texters_cookie) {
              
              // set the language to use based on what number the text came To
              if (sent_to_phone == "+1" + spanish_phone_number ) {
                  // call came to spanish number
                  message = question_list[i].response.spanish; 
                  language = "spanish";
              } else {
                  // call came to english number
                  message = question_list[i].response.english;
                  language = "english";
              }
              
              // set up the reply back to twilio
              var reply = {};
              
              // build the cookie we're going to send to twilio
              reply.cookie = "question=" + question_list[i].set_cookie + "; id=" + id_cookie;
              
              // format the message into twilio's "twiml" format
              reply.message = formatReply(message);
                  
              console.log("processing: " + id_cookie + ", " + texter + "," + text_body + "," + texters_cookie + "," + language);
              
              // post to the google form
              http_request.post(spreadsheetURL,
                { 
                    form: {
                        "entry.1098083245": id_cookie,
                        "entry.437444660": text_body,
                        "entry.335897669": texters_cookie,
                        "entry.1088215977": language} },
                  
                    function (error, resp, body) {
                        if (!error && resp.statusCode == 200) {
                            console.log("successfully posted to spreadsheet ");
                        } else {
                            console.log("error posting to spreadsheet: ", body);
                        }
                        
                        // "fulfill" the lambda process, 
                        // closing the program and passing the "reply" 
                        // back to lambda.js containing .cookie and .message
                        fulfill(reply);    
                        
                }
              );
                      
          
          }  // closes cookie-match section
          
      }  // closes the quesiton loop
      
  });  // closes the Promise section
  
};  // closes module.exports

var formatReply = function(text_message){
  
  // build the XML to send back to Twilio
  var twiml = new twilio.TwimlResponse();
  twiml.message(text_message);

  // return the XML
  return(twiml.toString());
  
};
