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
 * Observable Class
 */
define([
            'jquery',
            'ju-shared/observable-class'
        ],
        function(
            $,
            ObservableClass
        ) {
    'use strict';

    /**
     *
     * Ths idea of this class is to use it as a communication bus
     * that will be used by components in the same tree
     * to comunicate with other components not at the same level
     * of hierarchy or depth
     *
     * It will be the backbone to communicate global events in all the components tree
     * and also provide access to shared instances
     *
     */
    var Backbone = ObservableClass.extend({
        init : function() {
            /*
                Stores the shared components
             */
            this.sharedInstances = {};
        },
        getSharedInstance : function(key) {
            return this.sharedInstances[key];
        },
        /**
         * We will store a instance with a key in the shared instances
         */
        addSharedInstance : function(key, value) {
            this.sharedInstances[key] = value;
        },
        /**
         * Removes a shared instance from the local variable
         */
        removeSharedInstance : function(key) {
            var removedInst = this.sharedInstances[key];
            delete this.sharedComponents[key];
            return removedInst;
        }
    });

    Backbone.classMembers({
        SHARED : {
            IMMEDIATE_TRACKER : 'immediateTracker',
            CHANGES_TRACKER : 'changesTracker',
            PATIENT_INFO : 'patientInfo'
        }
    });

    // Exporting module
    return Backbone;

});
