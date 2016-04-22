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
 * Default save strategy
 */
define([
            'ju-shared/observable-class',
            'ju-components/helper/options',
            'ju-components/data-flow/save/changes-tracker'
        ],
        function(
            ObservableClass,
            OptionsHelper,
            ChangesTracker
        ) {
    'use strict';

    var SaveStrategy = ObservableClass.extend({
        init : function(opts) {
            this.setOptions({
                component : null,
                tracker : ChangesTracker
            });

            // Options manager
            this.optsManager.prepareOptions(opts);
            this.opts = this.optsManager.getOptions();

            // Store component
            this.component = this.opts.component;
        },

        setup : function(trackerOptions) {
            // Define changes tracker
            this._setupTracker(trackerOptions);

            // Subscribe to events
            this.tracker.track();
        },

        _setupTracker : function(trackerOptions) {
            // Backbone must be previously set on component
            var backbone = this.component.backbone,
                trackerSingletonClass = this.opts.tracker;

            // A tracker class must always be provided by options
            this.tracker = trackerSingletonClass.getInst(backbone);

            // attaches custom event listeners (if any)
            if (trackerOptions) {
                this.tracker.listenChangeEvents(trackerOptions.trackEvents);
            }
        },

        getTracker : function() {
            return this.tracker;
        },

        /**
         * Called by a save handler to filter/alter the data that's
         * going to be saved
         * @param  {Component} component to get data from
         * @return {Object}              data obtained
         */
        getDataForSubmission : function(component) {
            return component.getData();
        },

        /**
         * Handles the save success event triggered from the payloadHandler by
         * bypassing the event to the higher level.
         * @abstract
         */
        onSaveSuccess : function(/*response*/) {
        },

        /**
         * Some strategies perform operations when they detect events related to data changes or similar
         * This method can be overriden to perform data operations with a custom set of data that might not have been produced by the components
         * @param  {Object} model reflects the data with the structure of a portion of the component tree this strategy is related to
         * @abstract
         */
        initializeWithDataModel : function(/*dataModel*/) {
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
         * Initialize options manager
         * @see  OptionsHelper
         */
        _initOptsManager : function() {
            this.optsManager = this.optsManager || new OptionsHelper();
        }
    });

    return SaveStrategy;

});
