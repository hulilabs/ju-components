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
 * Configures the children component definition, allows this component to determine
 * which components to load in a dynameic way using the parameter passed along
 * from the load function of the root component
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

    // Enable a base component to load children dynamically (attach methods) based on
    // custom logic like permissions or flags. Review following util methods:

    // ---- sample child definition ----
    // component_name : {
    //     component : Catalog.COMPONENT,
    //     insertionPoint : '.selector',
    //     [...flags],
    //     extendedOpts : {...}
    // }

    // @interface: loadChildrenDefinition

    // @warn ONLY initChildrenDef should have access to childrenKey and _addChildrenDef

    var ChildrenLoaderHelper = Class.extend({
        init : function(childrenKeys, childrenDefinitions) {
            // Define childrens
            this.childrenDef = this.childrenDef || {};
            this.childrenDefinitions = childrenDefinitions || {};

            // Loaded children keys
            // Usually a set of default keys is included at initChildrenDef
            this.childrenKeys = childrenKeys || [];
        },
        /**
         * Defines if a children is accepted from the definition
         * Custom implementation must be provided by project
         * @abstract
         */
        loadChildDefinition : function(/* key, definition */) {},
        //
        // Getters
        //
        getChildrenDefinition : function() {
            return this.childrenDef;
        },
        getChildrenKeys : function() {
            return this.childrenKeys;
        },
        getChildrenCount : function() {
            return this.getChildrenKeys().length;
        },
        getChildKeyByIndex : function(index) {
            // Default to null (no key found)
            return this.childrenKeys[index] || null;
        },
        getChildDefinitionByKey : function(key) {
            // Do NOT default to empty object {}
            return this.childrenDefinitions[key];
        },
        getChildDefinitionByIndex : function(index) {
            return this.getChildDefinitionByKey(this.getChildKeyByIndex(index));
        },
        /**
         * Add key for inclusion check
         */
        addChildKey : function(key) {
            return ($.inArray(key, this.childrenKeys) < 0) ? this.childrenKeys.push(key) : false;
        },
        /**
         * Checks if a key was loaded
         */
        isKeyLoaded : function(key) {
            return ($.inArray(key, this.childrenKeys) > -1);
        },
        /**
         * Check if any key was loaded
         */
        isAnyKeyLoaded : function(arrKeys) {
            var loaded = false;
            for (var i = 0, len = arrKeys.length; i < len; i++) {
                var key = arrKeys[i];
                if (this.isKeyLoaded(key)) {
                    loaded = true;
                    break;
                }
            }
            return loaded;
        }
    });

    // Exporting module
    return ChildrenLoaderHelper;

});
