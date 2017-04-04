var restify = require('restify');
var builder = require('botbuilder');

//=========================================================
// Bot Setup
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', function (session) {
    let msg = new builder.Message(session)
        .addAttachment(
            new builder.HeroCard(session)
                .title('Ko Tu vēlies meklēt?')
                .buttons(
                    ["Autoru", "Grāmatu"].map(
                        b => builder.CardAction.postBack(session, b, b)
                    )
                )
        )
    session.send(msg);
    session.replaceDialog();
});