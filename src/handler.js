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

define([
            'ju-shared/observable-class',
            'ju-components/helper/options'
        ],
        function(
            ObservableClass,
            OptionsHelper
        ) {
    'use strict';

    /**
     * Base class for handlers definition
     */
    var BaseHandler = ObservableClass.extend({
        init : function(opts) {
            // Handlers always have a reference to the component related to them
            // sort of two ways binding (the component stores the handler instance)
            this.setOptions({
                component : null
            });

            // Options manager
            this.optsManager.prepareOptions(opts);
            this.opts = this.optsManager.getOptions();

            // Store component
            this.component = this.opts.component;

            // Run handler setup
            this.setup();
        },
        /**
         * Initialize options manager
         * @see  OptionsHelper
         */
        _initOptsManager : function() {
            this.optsManager = this.optsManager || new OptionsHelper();
        },
        /**
         * Store options in manager
         * @decorator
         * @see  OptionsHelper
         */
        setOptions : function() {
            this._initOptsManager();
            this.optsManager.setOptions.apply(this.optsManager, arguments);
        },
        /**
         * Handler setup
         * @abstract
         */
        setup : function() {
        },
        /**
         * Run handler main action
         * @abstract
         */
        process : function() {
        }
    });

    // Exporting module
    return BaseHandler;

});
