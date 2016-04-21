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
            'ju-shared/observable-class'
        ],
        function(
            ObservableClass
        ) {
    'use strict';

    /**
     * Tracks changes for on get and save payload construction
     * @param {Backbone} backboneInst component backbone instance
     */
    var ChangesTracker = ObservableClass.extend({
        init : function(backboneInst) {
            this.backbone = backboneInst;
            this.isTracking = false;
        },
        /**
         * Start tracking action
         */
        track : function() {
            if (this.isTracking) {
                Logger.error('ChangesTracker : tracker is already tracking');
            }
            this.bindChangeEvents();
            this.isTracking = true;
        },
        /**
         * Handle event as a modification or change to be track
         * @param {string}   eventName
         * @param {function} handler   Optional: custom event callback handler
         *                             Default: modifiedHandler
         */
        listenChangeEvent : function(eventName, handler) {
            handler = handler || $.proxy(this.modifiedHandler, this);
            this.backbone.on(eventName, handler);
        },
        /**
         * Attach listeners to backbone for on change events
         * Components firing those events will be collected as changed for on-demand save
         * @uses   addModifyEvent, modifiedHandler
         * @abstract
         */
        bindChangeEvents : function() {
        },

        /**
         * Batch attach listener to backbone for on change events
         * @param {Array} eventsToTrack either array of event names or array of {event, handler}
         */
        listenChangeEvents : function(eventsToTrack) {
            if ($.isArray(eventsToTrack) && eventsToTrack.length > 0) {
                for (var i = eventsToTrack.length - 1; i >= 0; i--) {
                    if ('string' === typeof eventsToTrack[i]) {
                        this.listenChangeEvent(eventsToTrack[i]);
                    } else if (eventsToTrack[i].event && eventsToTrack[i].handler) {
                        this.listenChangeEvent(eventsToTrack[i].event, eventsToTrack[i].handler);
                    } else {
                        Logger.error('ChangesTracker : unable to bind change event', eventsToTrack[i]);
                    }
                }
            }
        },

        /**
         * Handler for when a component report itself or a child as modified
         * Fires ChangesTracker.EV.COMPONENT_CHANGED event
         * @param  {object} changedComponent component to be processed as changed
         */
        modifiedHandler : function(/* changedComponent */) {
        }
    });

    ChangesTracker.classMembers({
        EV : {
            COMPONENT_CHANGED : 'compChanged'
        },
        getInst : function(backboneInst) {
            // check if the notification center has already an id
            if (!backboneInst) {
                Logger.error('ChangesTracker: A valid backbone must be provided');
                return;
            }

            // ALL changes tracker will be stored as CHANGES_TRACKER at current backbone instance
            var sharedInstanceKey = backboneInst._class.SHARED.CHANGES_TRACKER,
                changesTracker = backboneInst.getSharedInstance(sharedInstanceKey);

            if (!changesTracker) {
                // No instance was defined, create one
                changesTracker = new ChangesTracker(backboneInst);
                backboneInst.addSharedInstance(sharedInstanceKey, changesTracker);
            }

            return changesTracker;
        }
    });

    // Exporting module
    return ChangesTracker;

});
