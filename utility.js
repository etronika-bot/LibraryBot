"use strict";
var jsdom = require('jsdom');
var request = require('request');
var builder = require('botbuilder');

var search_book = function (s) {
    let url = 'https://jelgava.biblioteka.lv/Alise/lv/advancedsearch.aspx?crit0=name&op0=%25LIKE%25&val0=';
    let bookurl = 'https://jelgava.biblioteka.lv/AliseRestApi/api/BibliographicRecords/';
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
                Promise.all(
                    ids.map(id => {
                        return new Promise((resolve, reject) => {
                            request({
                                url: bookurl + id,
                                json: true
                            }, (err, res, body) => {
                                if (!err && res.statusCode === 200) {
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
                        });
                    })
                ).then(books => {resolve(books);});
            }
        );
    });
};

var book_carousel = function(session, books) {
    console.log(books);
    return books.map(book => {
        console.log(book.title);
        return new builder.HeroCard(session)
            .title(book.title)
            .text(book.author ? book.author : '-')
            .images([
                builder.CardImage.create(session, "http://www.library.psychol.cam.ac.uk/images/GenericBook/image")
            ]);
    })
}

module.exports = {
    search_book: search_book,
    book_carousel: book_carousel
};