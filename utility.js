"use strict";
var jsdom = require('jsdom');
var request = require('request');
var builder = require('botbuilder');
var Fuse = require('fuse.js');
var libs = require('./libs.json');
var store = require('azure-storage');


var get_book = function(id) {
    let bookurl = 'https://jelgava.biblioteka.lv/AliseRestApi/api/BibliographicRecords/';
    let thumburl = 'https://jelgava.biblioteka.lv/Alise/bookthumbnail.axd?version=070217_015954&maxHeight=250&id='; //&maxWidth=185
    return new Promise((resolve, reject) => {
        request({
            url: bookurl + id,
            json: true
        }, (err, res, body) => {
            if (!err && res.statusCode === 200) {
                if (!body.HasCopies) {
                    reject('Kopijas nav pieejamas');
                }
                let book = {
                    id: body.Id,
                    title: body.Title,
                    author: body.Author,
                    isbn: body.ISBN,
                    year: body.Year,
                    annotation: body.Annotation
                }
                resolve(book);
            }
        });
    }).then(book => {
        return new Promise((resolve) => {
            request({
                url: thumburl + id
            },
            (err, res, body) => {
                if (!err && res.statusCode === 200) {
                    book.img = thumburl + book.id;
                }
                else {
                    book.img = "http://www.library.psychol.cam.ac.uk/images/GenericBook/image";
                }
                resolve(book);
            });
        });
    })
    .catch(err => {
        return Promise.resolve(false);
    });
}

var search_book = function (s) {
    let url = 'https://jelgava.biblioteka.lv/Alise/lv/advancedsearch.aspx?crit0=name&op0=%25LIKE%25&val0=';
    return new Promise((resolve, reject) => {
        jsdom.env(
            url + s,
            (error, window) => {
                if (error) {
                    reject('Diemžēl neizdevās. ' + error);
                    return;
                }
                let d = window.document;
                let re = /Book_BibliographicDescription_(\d+)/g;
                let ids = [];
                let result = [];
                
                while ((result = re.exec(d.getElementById('_SearchResult').innerHTML)) !== null) {
                    ids.push(result[1]);
                }
                Promise.all(ids.map(get_book)).then(books => {
                    resolve(books.filter(b => b));
                });
            }
        );
    });
};

var book_carousel = function(session, books) {
    let bookurl = 'https://jelgava.biblioteka.lv/Alise/lv/book.aspx/bibliographic?id=';
    return books.map(book => {
        let buttons = [builder.CardAction.openUrl(session, bookurl + book.id, "Atvērt bibliotēkas lapu")];
        if (book.annotation) {buttons.push(builder.CardAction.postBack(session, 'annotate-' + book.id, "Vairāk"));}
        return new builder.HeroCard(session)
            .title(book.title)
            .text(book.author ? book.author : '-')
            .images([
                builder.CardImage.create(session, book.img)
            ])
            .buttons(buttons);
    });
}

var get_lib_options = function(s) {
    let opts = {
        keys: ['name'],
        threshold: 0.4,
    }
    let fuse = new Fuse(libs, opts);
    let result = fuse.search(s);
    return(result.length > 10 ? result.slice(0,10) : result);
}

var lib_carousel = function(session, libs) {
    return libs.map(lib => {
        let buttons = [
            builder.CardAction.openUrl(session, lib.home_page_url, "Atvērt bibliotēkas lapu"),
            builder.CardAction.imBack(session, 'libid-' + lib.id, "Izvēlēties šo")
        ];
        return new builder.HeroCard(session)
            .title(lib.name)
            .buttons(buttons);
    });
}

module.exports = {
    search_book: search_book,
    book_carousel: book_carousel,
    get_book: get_book,
    get_lib_options: get_lib_options,
    lib_carousel: lib_carousel
};