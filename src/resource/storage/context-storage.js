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
     * Constants
     */
    var KEYS_SEPARATOR = ',';

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
         *         ABC,XYZ : RESPONSE OBJECT
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
                    var expandedKeys = this._expandKeys(vars[varKey]);
                    varsDict[varKey] = $.extend(varsDict[varKey], expandedKeys);
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
        },
        /**
         * Given an object with compressed keys, this method will expand it to individual
         * keys, each one with the same common payload.
         * For example:
         * Given the following object:
         *
               "patient_today_appointment": {
                    "27cb7ebc-86a4-46b7-892a-9b7170e4ed74,9edfb869-1cd3-4b2d-88fc-18ed380f8b1a": {
                        "id_event": null,
                        "id_patient_checkup_record": null,
                        "label": "iniciar consulta"
                    }
                }
         *  The final result should be:
         *
                "patient_today_appointment": {
                    "27cb7ebc-86a4-46b7-892a-9b7170e4ed74": {
                        "id_event": null,
                        "id_patient_checkup_record": null,
                        "label": "iniciar consulta"
                    },
                    "9edfb869-1cd3-4b2d-88fc-18ed380f8b1a": {
                        "id_event": null,
                        "id_patient_checkup_record": null,
                        "label": "iniciar consulta"
                    },
                }
         * @return Object Expanded object
         */
        _expandKeys : function(collapsedObject) {
            if (!collapsedObject) {
                return collapsedObject;
            }

            var expandedKeys = {};
            $.each(collapsedObject, function(keysString, value) {
                var keys = keysString.split(KEYS_SEPARATOR);
                if (keys.length > 1) {
                    $.each(keys, function(index, key) {
                        expandedKeys[key] = value;
                    });
                } else {
                    expandedKeys[keysString] = value;
                }
            });

            return expandedKeys;

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
