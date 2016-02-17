/**                   _
 *  _             _ _| |_
 * | |           | |_   _|
 * | |___  _   _ | | |_|
 * | '_  \| | | || | | |
 * | | | || |_| || | | |
 * |_| |_|\___,_||_| |_|
 *
 * (c) Huli Inc
 */

/**
 * Application config client-side module
 * This layer provides access to server side application settings
 */
define([
            'jquery',
            'ju-shared/client-vars-manager'
        ],
        function(
            $,
            ClientVarsManager
        ) {
    'use strict';

    /**
     * App config manager in the client side
     * Contains application settings coming from the server side
     */
    var ContextStorage = ClientVarsManager.extend({
        init : function() {
            this._super.apply(this, arguments);
        },
        /**
         * Appends new key-values to the current
         * dictionary
         * @param  {object} vars      object with key-value pairs with format
         * {
         *     handler: {
         *         ABC : RESPONSE OBJECT,
         *         XYZ : RESPONSE OBJECT
         *     },
         *     handlerAlt : {
         *         XYZ : RESPONSE OBJECT
         *     }
         * }
         * @param  {string} groupName Optional. Name of the group
         *                            of vars that will be appended
         */
        append : function(vars) {

            var varsDict = this.varsDictionary;
            // Copy all the new vars to the current instance dictionary
            for (var varKey in vars) {
                if (vars.hasOwnProperty(varKey)) {
                    varsDict[varKey] = $.extend(varsDict[varKey], vars[varKey]);
                }
            }
        },
        /**
         * Gets a particlar value by the key and the component id
         */
        get : function(handlerName, component) {
            var handlerData = this.varsDictionary[handlerName];
            if (handlerData == null) {
                Logger.error("ContextStorage: Couldn't find handler data for key", handlerName);
                return;
            }

            if (!component.id) {
                Logger.error('ContextStorage: Cannot retrieve data when component id is not provided');
                return;
            }

            var data = handlerData[component.id];
            return data;
        }
    });

    // Keys comming from the server side
    var keys = {
    };

    ContextStorage.classMembers({
        k : keys
    });

    // Exports
    return ContextStorage;

});
