"use strict";
var jsdom = require('jsdom');

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
                let id = /Book_BibliographicDescription_(\d+)/g.exec(d.getElementById('_SearchResult').innerHTML)[1];
                resolve(id);
            }
        );
    });
}

module.exports = {
    search_book: search_book
};