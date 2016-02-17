
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
 * CATALOG
 *
 * Component defintions storage
 * Useful for reusing definitions through an application
 *
 * - Register component definition
 *      Catalog.register('COMPONENT_DEFINITION_KEY', definitionObject)
 *
 * - Reuse component definition
 *      Catalog.COMPONENT_DEFINITION_KEY
 *      Catalog.extend(Catalog.COMPONENT_DEFINITION_KEY, customDefinitionObject)
 *
 * - Register handler (this context set to Catalog)
 *      Catalog.handler('registerComponent', function() { this.register(definitionObject) })
 */

define([
            'jquery',
            'ju-shared/class'
        ],
        function(
            $,
            Class
        ) {

    'use strict';

    var Catalog = Class.extend({
        /**
         * Extends the definition of a component using a deep copy
         * @param  {Object} target    The base definition that will be used
         * @param  {Object} newObject An object with all the entries that want to be overwritten
         * @return {Object}           A new object with the target and new object values merged
         */
        extend : function(target, newObject) {
            return $.extend(true, {}, target, newObject);
        },
        /**
         * Component registration
         * @param {string} name  Component name
         * @param {Object} value Component params definition
         */
        register : function(name, value) {
            if (!this[name]) {
                this[name] = value;
            } else {
                Logger.error('Catalog: component name is duplicated or invalid ', name);
            }
        },
        /**
         * Register custom handler for dynamic component definitions
         * @param  {string}   name     Handler method name
         * @param  {Function} callback Handler method definition
         */
        handler : function(name, callback) {
            if (!this[name]) {
                var self = this;
                // Wrap callback to setup this as Catalog context
                this[name] = function() {
                    callback.apply(self, arguments);
                };
            } else {
                Logger.error('Catalog: handler name is duplicated or invalid ', arguments);
            }
        }
    });

    // Return catalog instance
    return new Catalog();
});
