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
 * Base component
 */
define([
            'ju-shared/class',
            'ju-shared/l10n'
        ],
        function(
            Class,
            L10n
        ) {
    'use strict';

    /**
     * Represents a simple input text editable component
     */
    var ComponentUtil = Class.extend({
    });

    ComponentUtil.classMembers({
        /**
         * Check if the string is an L10n key
         */
        isL10nKey : function(str, prefixKey) {
            if ('string' === typeof str) {
                prefixKey = prefixKey || /^!@/;
                return (str.match(prefixKey) != null);
            }

            return false;
        },
        /**
         * Process the L10n keys in the object
         * For example:
         * {
         *     key1 : '!@label_new',
         *     key2 : '!@label_save'
         * }
         */
        processObjL10n : function(obj, skipKeys, prefixKey) {
            var newObj = obj;
            if (obj) {
                prefixKey = prefixKey || /^!@/;
                $.each(obj, function(key, value) {

                    // Only process strings
                    if (!skipKeys || skipKeys.indexOf(key) == -1) {
                        if (typeof value === 'string') {
                            // Translating string value
                            var l10nKey = value.replace(prefixKey, '');
                            if (value !== l10nKey) {
                                var translatedValue = L10n.t(l10nKey);
                                newObj[key] = translatedValue;
                                return;
                            }
                        } else if (typeof value === 'object') {
                            // Value is an object so we need to delegate recursively
                            newObj[key] = ComponentUtil.processObjL10n(value, skipKeys, prefixKey);
                            return;
                        }
                    }
                    // The value for this key stays the same
                });
            }

            return newObj;
        },

        /**
         * This method takes a complex object, eventually with several levels
         * and flattens it.
         */
        flatten : function(obj) {

            var self = this,
                values = [];

            if (obj) {
                $.each(obj, function(key, value) {

                    if (typeof value !== 'object') {
                        if (value !== undefined) {
                            values.push(value);
                        }
                    } else {
                        $.merge(values, self.flatten(value));
                    }
                });
            }

            return values;
        },
        /**
         * Function to format a string with numbered parameters such as
         * {0}, {1}
         * @param  {string} source Format string
         * @param  {array} params parameters given to the format function to replace in the source
         * @return {string}        Formatted string
         */
        format : function(source, params) {
            var self = this;

            if (arguments.length === 1) {
                return function() {
                    var args = $.makeArray(arguments);
                    args.unshift(source);
                    return self.format.apply(this, args);
                };
            }
            if (arguments.length > 2 && params.constructor !== Array) {
                params = $.makeArray(arguments).slice(1);
            }
            if (params.constructor !== Array) {
                params = [params];
            }
            $.each(params, function(i, n) {
                source = source.replace(new RegExp('\\{' + i + '\\}', 'g'), function() {
                    return n;
                });
            });
            return source;
        },
        /**
         * Checks for any complex objects emptiness recursively
         * http://jsfiddle.net/f6bvq9np/1/
         * http://jsperf.com/isemptydata
         */
        isEmptyObject : function(data, validValues) {
            var dataType = typeof data;
            // Custom valid values check
            if (validValues && $.inArray(data, validValues) > -1) {
                return false;
            }
            // Most common and leaf values
            if (dataType === 'undefined' || data === null || data === '' || data === '0' || data === 0) {
                return true;
            }
            // Strings
            if (dataType === 'string' || dataType === 'number') {
                return false;
            }
            // Boolean
            if (dataType === 'boolean') {
                return data;
            }
            // Arrays
            if (Array.isArray(data)) {
                return (data.length === 0) ? true : (function(that) {
                    var isEmpty = true;
                    for (var i = 0, len = data.length; i < len; i++) {
                        if (!that.isEmptyObject.call(that, data[i])) {
                            isEmpty = false;
                            break;
                        }
                    }
                    return isEmpty;
                })(this);
            }
            // Objects
            if (data !== null && dataType === 'object') {
                var isEmpty = true;
                for (var i = 0, keys = Object.keys(data), l = keys.length; i < l; ++i) {
                    if (!this.isEmptyObject(data[keys[i]])) {
                        isEmpty = false;
                        break;
                    }
                }
                return isEmpty;
            }
            // Unknown type, assume it is empty
            return true;
        },

        /**
         * With a given `propertyName` creates a field in `destinyObject` with the value
         * of that field in `sourceObject`, then removes the property from `sourceObject`
         * @param  {String} propertyName
         * @param  {Object} sourceObject
         * @param  {Object} destinyObject
         * @return {boolean}              was the property moved?
         */
        moveProperty : function(propertyName, sourceObject, destinyObject) {
            if (sourceObject && sourceObject.hasOwnProperty(propertyName) && destinyObject) {
                destinyObject[propertyName] = sourceObject[propertyName];
                sourceObject[propertyName] = null;
                delete(sourceObject[propertyName]);

                return true;
            } else {
                return false;
            }
        },

        /**
         * Moves (cut 'n' paste) all the properties whose name is included
         * in `match` array from source to destiny
         * @param  {array}  match   array of property names
         * @param  {object} source  {obj:Object, key:string}, source wil be `obj[key]`
         * @param  {mixed}  destiny string if `obj` is the same as source's, or
         *                          an object similar to source
         */
        moveNotMatchedProperties : function(match, source, destiny) {
            if ('string' === typeof destiny) {
                var newDestiny = {
                    key : destiny,
                    obj : source.obj
                };

                destiny = newDestiny;
            }

            var sourceObjectCopy = $.extend({}, source.obj[source.key]);
            if ($.isArray(match)) {
                // will store references to the children kept
                var newChildrenComponents = {};

                // every matched child will be moved to newChildrenComponents object
                $.each(match, function(index, keyToMatch) {
                    // moves the matched key from sourceObjectCopy to newChildrenComponents
                    ComponentUtil.moveProperty(keyToMatch, sourceObjectCopy, newChildrenComponents);
                });

                // copies all the remaining components
                $.extend(destiny.obj[destiny.key], sourceObjectCopy);

                source.obj[source.key] = newChildrenComponents;
            }

        }
    });

    // Exporting module
    return ComponentUtil;

});
