module.exports ={
    facebookAuth:{
        clientID:"2431747826876977",
        clientSecret:"c446f93c9ca6a29aed88e190342ba218",
        callbackURL:"http://localhost:9000/facebook/oauth/callback"
    },
    google:{
        installed:{
            "client_id":"464867700154-n1chvvro4c2qvelqal4otnt4kef3u97f.apps.googleusercontent.com",
            "project_id":"stalk-243712",
            "auth_uri":"https://accounts.google.com/o/oauth2/auth",
            "token_uri":"https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
            "client_secret":"bIiTeBJ9Olu-Z2vURy7AKSVl",
            "redirect_uris":["http://localhost:3000"],
            "javascript_origins":["http://localhost:3000"]},
        defaultScope : [
            'https://www.googleapis.com/auth/plus.me',
            'https://www.googleapis.com/auth/userinfo.email',
          ]
    }
};