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
        for (i = 0; i < nodeList.length; i++) {
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
     * convert a text variable "x" to a span with the needed
     * attributes to style it with CSS
     * @param  {string} value
     * @return {string}
     */
    function createHTMLVariable( value ) {

        var clean_value = value.replace(/[^a-zA-Z._]/g, "");

        // check if variable is valid
        if( ! isValid(clean_value) )
            return value;

        // map value to a more readable value
        if( mappers.hasOwnProperty(clean_value) )
            clean_value = mappers[clean_value];

        editor.fire('VariableToHTML', {
            value: value,
            cleanValue: clean_value
        });

        return '<span class="variable" data-original-variable="' + value + '">' + clean_value + '</span>';
    }

    /**
     * convert HTML variables back into their original string format
     * for example when a user opens source view
     * @return {void}
     */
    function HTMLToString()
    {
        var nodeList = [],
            nodeValue,
            node,
            div;

            // find nodes that contain a HTML variable
        tinymce.walk( editor.getBody(), function(n) {
            var original = n.parentElement.getAttribute('data-original-variable');
            if (original !== null) {
                nodeList.push(n);
            }
        }, 'childNodes');

        // loop over all nodes that contain a HTML variable
        for (i = 0; i < nodeList.length; i++) {
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

    /**
     * get variable out of a string
     * keep in mind that this will only return the first variable even if there are more then one
     * for example "{hello} test {world}" will return "hello"
     * @param  {string} value
     * @return {string}
     */
    function getVariable(value) {
        var variable, clean_variable;
        var variable_pick_regex = new RegExp('{([a-z. _]*)?}', 'g');
        var variable_clean_regex = new RegExp('[^a-zA-Z._]', 'g');
        var matches = value.match( variable_pick_regex );
        var result = {};

        if( matches.length > 0 ) {
            for( var i=0 ; i < matches.length ; i++ ) {
                variable = matches[i];
                clean_variable = variable.replace( variable_clean_regex, '');
                result[ clean_variable ] = variable;
            }
            return result;
        }

        return null;
    }

    /**
     * check if a certain variable is valid
     * @param {string} name
     * @return {bool}
     */
    function isValid( name )
    {

        if( ! valid || valid.length === 0 )
            return true;

        var valid_string = '|' + valid.join('|') + '|';

        return valid_string.indexOf( '|' + name + '|' ) > -1 ? true : false;
    }

    /**
     * this function will make sure variable HTML elements can
     * not be edited
     * and also make it possible to delete them by hitting backspace
     * @param  {object} e
     * @return {void}
     */
    function editableHandler(e) {

        var currentNode = tinymce.activeEditor.selection.getNode();
        var keyCode = e.keyCode;

        if( currentNode.classList.contains('variable') ) {

            if( keyCode === VK.DELETE || keyCode === VK.BACKSPACE ) {
                // user can delete variable nodes
                editor.fire('VariableDelete', {value: currentNode.nodeValue});
                editor.dom.remove( currentNode );
            } else if ( keyCode === VK.SPACEBAR || keyCode === VK.RIGHT || keyCode === VK.TOP || keyCode === VK.BOTTOM )  {
                e.preventDefault();
                var variable = currentNode.getAttribute('data-original-variable');
                var t = document.createTextNode(" ");
                editor.dom.insertAfter(t, currentNode);
                setCursor('[data-original-variable="' + variable + '"]');
            } else if( keyCode === VK.LEFT ) {
                // move cursor before variable
            } else {
                // user can not modify variables
                e.preventDefault();
                editor.fire('VariableModifyAttempt', {node: currentNode});
            }
        }
    }

    /**
     * handle formatting the content of the editor based on
     * the current format. For example if a user switches to source view and back
     * @param  {object} e
     * @return {void}
     */
    function handleContentRerender(e) {
        return e.format === 'raw' ? stringToHTML() : HTMLToString();
    }

    function setCursor(selector) {
        var ell = editor.dom.select(selector)[0];
        var next = ell.nextSibling;

        //this.command('mceFocus',false,this.props.name);
        //editor.selection.setCursorLocation(next);
        editor.selection.setCursorLocation(next,1);

    }


    editor.on('nodechange', stringToHTML );
    editor.on('keyup', stringToHTML );
    editor.on('keydown', editableHandler );
    editor.on('beforegetcontent', handleContentRerender);

});
