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
 * Example self contained component with no resource dependencies
 * that displays a "hello world" in the view
 *
 * WARNING : proof of concept only, not a "good practices" guideline
 *           however, explanatory comments are reliable :p
 */
define( [
            'ju-components/base'
        ],
        function (
            BaseComponent
        ) {

    'use strict';

    var RESOURCE_MAP = {
        template : [
            // 'path/to/template'
        ],
        cssFile : [
            // 'path/to/css/file'
        ],
        l10n : [
            // 'l10n_key'
        ]
    };

    var CHILDREN_DEFINITION = {
        /**
         * example definition
        child_component : {
            component : 'path/to/child/definition',
            insertionPoint : '.selector',
            opts : {
                // component-dependent options
            }
        */
    };

    var BasicComponent1 = BaseComponent.extend({
        /**
         * Constructor
         *
         * Common place for setting default options, resources, children definition,
         * selectors, variables...
         */
        init : function () {
            this.setOptions({
                // set any default options values here
                customizableLabel : 'Hello world!'
            });

            this._super.apply(this, arguments);

            this.addResources(RESOURCE_MAP);

            this.childrenDef = CHILDREN_DEFINITION;
        },

        /**
         * Commonly used to setup the component's markup
         */
        configureComponent : function() {
            var dummyMarkup = '<div class="example">' + this.opts.customizableLabel + '</div>';
            this.appendToView(dummyMarkup);
        }

    });

    BasicComponent1.classMembers({
        // add 'static' class members here
        // i.e. can be accessed from the class definition without an instance
    });

    return BasicComponent1;
});