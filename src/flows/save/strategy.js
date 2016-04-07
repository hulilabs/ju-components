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
 * Save strategy
 * @abstract
 */
define([
            'jquery',
            'ju-components/flows/fetch/payload',
            'ju-components/flows/save/changes-tracker'
        ],
        function(
            $,
            PayloadHandler,
            ChangesTracker
        ) {
    'use strict';

    var SaveStrategy = PayloadHandler.extend({
        init : function() {
            this.setOptions({
                tracker : ChangesTracker
            });

            this._super.apply(this, arguments);
        },
        setup : function() {
            this._super.apply(this, arguments);

            // Define changes tracker
            this.setupTracker();

            // Subscribe to events
            this.tracker.track();
        },
        setupTracker : function() {
            // Backbone must be previously set on component
            var backbone = this.component.backbone,
                trackerSingletonClass = this.opts.tracker;

            // A tracker class must always be provided by options
            this.tracker = trackerSingletonClass.getInst(backbone);
        },
        getTracker : function() {
            return this.tracker;
        },
        /**
         * Triggers a save action in the current component
         * including the children component's data
         *
         * @param  function onSuccess    custom on success callback
         * @return Promise  Save promise
         * @abstract
         */
        saveData : function(/* onSuccess */) {
        },
        /**
         * Handles the save success event triggered from the payloadHandler by
         * bypassing the event to the higher level.
         * @abstract
         */
        onSaveSuccess : function(response) {
            this.trigger(SaveStrategy.EV.SAVE_SUCCESS, response);
        }
    });

    SaveStrategy.classMembers({
        EV : {
            SAVE_ERROR : 'saveError',
            SAVE_SUCCESS : 'saveSuccess'
        }
    });

    return SaveStrategy;

});
