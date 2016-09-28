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
    var mapper = editor.getParam("variable_mapper", {});

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

    function getMappedValue( cleanValue ) {
        if(typeof mapper === 'function')
            return mapper(cleanValue);

        return mapper.hasOwnProperty(cleanValue) ? mapper[cleanValue] : cleanValue;
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

        var cleanMappedValue = getMappedValue(cleanValue);

        editor.fire('VariableToHTML', {
            value: value,
            cleanValue: cleanValue
        });

        return '<span class="variable" data-original-variable="{' + cleanValue + '}" contenteditable="false">' + cleanMappedValue + '</span>';
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

                if(typeof node.getAttribute === 'function' && node.hasAttribute('data-original-variable')) {
                    var next = node.nextSibling;
                    editor.selection.setCursorLocation(next);
                }
            }

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
                var original = n.getAttribute('data-original-variable');
                if (original !== null) {
                    nodeList.push(n);
                }
            }
        }, 'childNodes');

        // loop over all nodes that contain a HTML variable
        for (var i = 0; i < nodeList.length; i++) {
            nodeValue = nodeList[i].getAttribute('data-original-variable');
            div = editor.dom.create('div', null, nodeValue);
            while ((node = div.lastChild)) {
                editor.dom.insertAfter(node, nodeList[i]);
            }

            // remove HTML variable node
            // because we now have an text representation of the variable
            editor.dom.remove(nodeList[i]);
        }

    }

    function setCursor(selector) {
        var ell = editor.dom.select(selector)[0];
        console.log('sel', selector, ell);
        if(ell) {
            console.log('set cursor', ell, next);
            var next = ell.nextSibling;
            editor.selection.setCursorLocation(next);
        }
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
        console.log('insert', value, htmlVariable);
        editor.execCommand('mceInsertContent', false, htmlVariable);
    }

    editor.on('nodechange', stringToHTML );
    editor.on('keyup', stringToHTML );
    editor.on('beforegetcontent', handleContentRerender);

    this.addVariable = addVariable;

});
