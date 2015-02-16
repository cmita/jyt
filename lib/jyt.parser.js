/**
 * Author: Jeff Whelpley
 * Date: 2/15/15
 *
 * This uses an HTML parser to precompile HTML files into Jyt objects.
 */
var htmlparser  = require('htmlparser');
var runtime     = require('./jyt.runtime');
var utils       = require('./jyt.utils');

/**
 * Convert the HTML parser DOM format to Jyt format
 * @param dom
 */
function convertDomToJyt(dom) {
    var i, elems;

    // if just one element in the array, bump it up a level
    if (utils.isArray(dom) && dom.length === 1) {
        dom = dom[0];
    }
    // if multiple, then we create a sibling array of elems and return it
    else if (utils.isArray(dom)) {
        elems = [];
        for (i = 0; i < dom.length; i++) {
            elems.push(convertDomToJyt(dom[i]));
        }

        return runtime.naked(elems, null);
    }

    // if type is string, then just return it
    if (dom.type === 'text') {
        return dom.data;
    }

    // if we get here then we have just one element
    var elem = runtime.elem(dom.name);
    var childCount = dom.children && dom.children.length;

    // attributes should be the same
    elem.attributes = dom.attribs;

    // recursively add children
    if (dom.children && dom.children.length) {
        elem.children = [];
        for (i = 0; i < childCount; i++) {
            elem.children.push(convertDomToJyt(dom.children[i]));
        }

        // if one child that is a string, bring it up a level
        if (elem.children.length === 1 && utils.isString(elem.children[0])) {
            elem.text = elem.children[0];
            delete elem.children;
        }
    }

    return elem;
}

/**
 * Parse the HTML into Jyt format
 * @param html
 * @param cb
 * @returns {*}
 */
function parse(html, cb) {

    if (!cb) {
        throw new Error('Must pass in callback to parse() as 2nd param');
    }

    var handler = new htmlparser.DefaultHandler(function (error, dom) {
        if (error) {
            cb('Error while parsing: ' + error);
        }
        else {
            var jytObj = convertDomToJyt(dom);
            cb(null, jytObj);
        }
    }, { ignoreWhitespace: true });

    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(html);
}

// expose functions
module.exports = {
    convertDomToJyt: convertDomToJyt,
    parse: parse
};