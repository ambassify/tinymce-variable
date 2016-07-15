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

tinymce.PluginManager.add('variables', function(editor) {

    var VK = tinymce.util.VK;
    var stringVariableRegex = new RegExp('{([a-z. _]*)?}', 'g');

    /**
     * Object that is used to replace the variable string to be used
     * in the HTML view
     * @type {object}
     */
    var mappers = editor.getParam("variable_mappers", {});


    /**
     * define a list of variables that are allowed
     * if the variable is not in the list it will not be automatically converterd
     * by default no validation is done
     * @todo  make it possible to pass in a function to be used a callback for validation
     * @type {array}
     */
    var valid = editor.getParam("variable_valid", null);

    /**
     * check if a certain variable is valid
     * @param {string} name
     * @return {bool}
     */
    function isValid( name )
    {

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

        // check if variable is valid
        if( ! isValid(cleanValue) )
            return value;

        // map value to a more readable value
        if( mappers.hasOwnProperty(cleanValue) )
            cleanValue = mappers[cleanValue];

        editor.fire('VariableToHTML', {
            value: value,
            cleanValue: cleanValue
        });

        return '<span class="variable" data-original-variable="' + value + '" contenteditable="false">' + cleanValue + '</span>';
    }

    /**
     * convert variable strings into html elements
     * @return {void}
     */
    function stringToHTML()
    {
        var nodeList = [],
            nodeValue,
            node,
            div;

        // find nodes that contain a string variable
        tinymce.walk(editor.getBody(), function(n) {
            if (n.nodeType == 3 && n.nodeValue && stringVariableRegex.test(n.nodeValue)) {
                nodeList.push(n);
            }
        }, 'childNodes');

        // loop over all nodes that contain a string variable
        for (var i = 0; i < nodeList.length; i++) {
            nodeValue = nodeList[i].nodeValue.replace(stringVariableRegex, createHTMLVariable);
            div = editor.dom.create('div', null, nodeValue);
            while ((node = div.lastChild)) {
                editor.dom.insertAfter(node, nodeList[i]);
            }

            // remove text variable node
            // because we now have an HTML representation of the variable
            editor.dom.remove(nodeList[i]);
        }

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
        tinymce.walk( editor.getBody(), function(n) {
            if (n.nodeType == 1) {
                var original = n.parentElement.getAttribute('data-original-variable');
                if (original !== null) {
                    nodeList.push(n);
                }
            }
        }, 'childNodes');

        // loop over all nodes that contain a HTML variable
        for (var i = 0; i < nodeList.length; i++) {
            nodeValue = nodeList[i].parentElement.getAttribute('data-original-variable');
            div = editor.dom.create('div', null, nodeValue);
            while ((node = div.lastChild)) {
                editor.dom.insertAfter(node, nodeList[i].parentElement);
            }

            // remove HTML variable node
            // because we now have an text representation of the variable
            editor.dom.remove(nodeList[i].parentElement);
        }

    }

    function setCursor(selector) {
        var ell = editor.dom.select(selector)[0];
        var next = ell.nextSibling;

        //this.command('mceFocus',false,this.props.name);
        //editor.selection.setCursorLocation(next);
        editor.selection.setCursorLocation(next, 1);

    }

    /**
     * handle formatting the content of the editor based on
     * the current format. For example if a user switches to source view and back
     * @param  {object} e
     * @return {void}
     */
    function handleContentRerender(e) {
        return e.format === 'raw' ? stringToHTML() : htmlToString();
    }

    /**
     * insert a variable into the editor at the current cursor location
     * @param {string} value
     * @return {void}
     */
    function addVariable(value) {
        var htmlVariable = createHTMLVariable(value);
        editor.execCommand('mceInsertContent', false, htmlVariable);
    }

    editor.on('nodechange', stringToHTML );
    editor.on('keyup', stringToHTML );
    editor.on('beforegetcontent', handleContentRerender);

    this.addVariable = addVariable;

});
