var question_list = [
    
    {"cookie": "first", 
    "response": "This is Question A", 
    "next_cookie": "b"},
    
    {"cookie": "b", 
    "response": "This is Question B", 
    "next_cookie": "c"},

    {"cookie": "c", 
    "response": "This is Question C", 
    "next_cookie": "d"},
    
    {"cookie": "d", 
    "response": "This is Question D", 
    "next_cookie": "e"},
    
    {"cookie": "e", 
    "response": "This is Question E", 
    "next_cookie": "f"},
    
    {"cookie": "f", 
    "response": "This is Question F", 
    "next_cookie": "g"},
    
    {"cookie": "g", 
    "response": "This is Question G", 
    "next_cookie": "h"},
    
    {"cookie": "h", 
    "response": "This is Question H", 
    "next_cookie": "done"}
  
];

for (var i = 0; i < question_list.length; i++) {
    if (question_list[i].cookie == "g") {
        console.log(question_list[i].response);
        console.log(question_list[i].next_cookie);
    }
}

