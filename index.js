var restify = require('restify');
var builder = require('botbuilder');
var u = require('./utility.js');
var libs = require('./libs.json');

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

var intents = new builder.IntentDialog();
bot.dialog('/', intents)
.cancelAction('cancelList', "Ok, atceļam.", {
    matches: /^atcelt/i
});

intents
    .matches(/autor/i, '/author')
    .matches(/grāmat/i, '/book')
    .matches(/atbild/i, '/qna')
    .matches(/annotate-/i, '/annotate')
    .matches(/mainīt bibliotēku/i, '/chooselib')
    .matches(/libid-/, '/libid')
    .onDefault('/default');

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/default', [
    (session, args, next) => {
        console.log(session.userData);
        if (!session.userData.lib) {
            session.beginDialog('/chooselib');
        } else {
            next();
        }
    },
    session => {
        let msg = new builder.Message(session)
            .addAttachment(
                new builder.HeroCard(session)
                    .title('Ko Tu vēlies darīt?')
                    .buttons(
                        ["Meklēt autoru", "Meklēt grāmatu", "Uzdot jautājumu", "Mainīt bibliotēku"].map(
                            b => builder.CardAction.postBack(session, b, b)
                        )
                    )
            );
        session.send(msg);
        session.endDialog();
    }
]);

bot.dialog('/book', [
    session => {
        builder.Prompts.text(session, 'Kāda grāmata Tev interesē.');
    },
    (session, res) => {
        u.search_book(res.response)
            .then(books => {
                let msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                msg.attachments(u.book_carousel(session, books));
                session.send(msg);
            });
        session.endDialog();
    }
]);

bot.dialog('/author', session => {
    session.send('Te izvēlēsimies autoru.');
    session.endDialog();
});

bot.dialog('/qna', session => {
    session.send('Te meklēsim atbildes uz jautājumiem brīvā formātā.')
    session.endDialog();
});

bot.dialog('/annotate', session => {
    let t = session.message.text;
    u.get_book(t.slice(t.indexOf('-') + 1))
        .then(b => {session.send(b.annotation ? b.annotation : 'Diemžēl plašāka apraksta nav.');});
    session.endDialog();
});

bot.dialog('/chooselib', [
    session => {
        builder.Prompts.text(session, 'Kurā bibliotēkā Tev būtu visērtāk saņemt grāmatas?');
    },
    (session, res) => {
        let carousel = u.lib_carousel(session, u.get_lib_options(res.response));
        let msg = new builder.Message(session);
        msg.attachmentLayout(builder.AttachmentLayout.carousel);
        msg.attachments(carousel);
        session.send(msg);
        session.endDialog();
    }
]);

bot.dialog('/libid', [
    session => {
        let t = session.message.text;
        session.userData.lib = t.slice(t.indexOf('-') + 1);
        let lib = libs.filter(lib => (session.userData.lib == lib.id))[0];
        session.send("Izvēlēta bibliotēka: " + lib.name);
        session.endDialog();
    }
]);