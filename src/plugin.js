/**
 * plugin.js
 *
 * Copyright, Sitebase
 * Released under MIT License.
 *
 * License: http://www.sitebase.be
 * Contributing: http://www.sitebase.be/contributing
 */

/*global tinymce:true */

/*------------------------------------*\
    VARIABLES
\*------------------------------------*/
var currentEditor;

/*------------------------------------*\
    PLUGINS
\*------------------------------------*/
tinymce.PluginManager.add('variables', function(editor) {
    // Convert variable strings to HTML when plugin is loaded
    editor.on('init', function () {
        currentEditor = editor;
        stringToHTML();
    });
});

tinymce.PluginManager.add('source', function(editor) {
    editor.addButton('source', {
        text: 'Edit source',
        icon: 'code',
        onclick: function() {
            var content;

            // Convert HTML to strings on 'Source' button click
            htmlToString();
            content = editor.getContent();

            // Source dialog settings
            editor.windowManager.open({
                title: 'Source code',
                body: [
                    {
                        minHeight: 250,
                        minWidth: 590,
                        multiline: true,
                        name: 'source',
                        type: 'textbox',
                        value: content
                    }
                ],
                onsubmit: function(e) {
                    // Insert modified content on submit
                    editor.setContent(e.data.source);
                },
                onclose: function() {
                    // Convert strings to HTML on close/cancel button click
                    stringToHTML();
                }
            });
        }
    });
});

/*------------------------------------*\
    FUNCTIONS
\*------------------------------------*/
/**
 * convert variable strings into html elements
 * @return {void}
 */
function stringToHTML()
{
    var nodeList = [],
        nodeValue,
        node,
        div,
        stringVariableRegex = new RegExp('{([a-z. _]*)?}', 'g');

    // find nodes that contain a string variable
    tinymce.walk(currentEditor.getBody(), function(n) {
        if (n.nodeType == 3 && n.nodeValue && stringVariableRegex.test(n.nodeValue)) {
            nodeList.push(n);
        }
    }, 'childNodes');

    // loop over all nodes that contain a string variable
    for (var i = 0; i < nodeList.length; i++) {
        nodeValue = nodeList[i].nodeValue.replace(stringVariableRegex, createHTMLVariable);
        div = currentEditor.dom.create('div', null, nodeValue);
        while ((node = div.lastChild)) {
            currentEditor.dom.insertAfter(node, nodeList[i]);
        }

        // remove text variable node
        // because we now have an HTML representation of the variable
        currentEditor.dom.remove(nodeList[i]);
    }
}

/**
 * check if a certain variable is valid
 * @param {string} name
 * @return {bool}
 */
function isValid( name )
{
    var valid = currentEditor.getParam("variable_valid", null);

    if( ! valid || valid.length === 0 )
        return true;

    var validString = '|' + valid.join('|') + '|';

    return validString.indexOf( '|' + name + '|' ) > -1 ? true : false;
}

/**
 * convert a text variable "x" to a span with the needed
 * attributes to style it with CSS
 * @param  {string} value
 * @return {string}
 */
function createHTMLVariable( value ) {
    var cleanValue = value.replace(/[^a-zA-Z._]/g, "");
    var mappers = currentEditor.getParam("variable_mappers", {});

    // check if variable is valid
    if( ! isValid(cleanValue) )
        return value;

    // map value to a more readable value
    if( mappers.hasOwnProperty(cleanValue) )
        cleanValue = mappers[cleanValue];

    currentEditor.fire('VariableToHTML', {
        value: value,
        cleanValue: cleanValue
    });

    return '<span class="variable" data-original-variable="' + value + '">' + cleanValue + '</span>';
}

/**
 * convert HTML variables back into their original string format
 * for example when a user opens source view
 * @return {void}
 */
function htmlToString()
{
    var nodeList = [],
        nodeValue,
        node,
        div;

        // find nodes that contain a HTML variable
    tinymce.walk( currentEditor.getBody(), function(n) {
        var original = n.parentElement.getAttribute('data-original-variable');
        if (original !== null) {
            nodeList.push(n);
        }
    }, 'childNodes');

    // loop over all nodes that contain a HTML variable
    for (var i = 0; i < nodeList.length; i++) {
        nodeValue = nodeList[i].parentElement.getAttribute('data-original-variable');
        div = currentEditor.dom.create('div', null, nodeValue);
        while ((node = div.lastChild)) {
            currentEditor.dom.insertAfter(node, nodeList[i].parentElement);
        }

        // remove HTML variable node
        // because we now have an text representation of the variable
        currentEditor.dom.remove(nodeList[i].parentElement);
    }

}
