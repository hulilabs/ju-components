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
        ],
        function(
        ) {

    'use strict';

    var DataBehaviorEvents = {
        EV : {
            UI : {
                // -- SAVE EVENTS --
                // should be triggered when a save ui provider
                // wants to save, like when a SAVE button is clicked
                REQUEST_SAVE : 'req-save',
                // should be triggered when a save ui provider cancels (discards changes)
                // the current save action
                DISCARD_SAVE_DATA : 'discard-save'
            },

            COMPONENT : {
                // -- SAVE EVENTS --
                SAVE_SUCCESS : 'c-save-success',
                SAVE_ERROR : 'c-save-error',

                // -- FETCH EVENTS --
                FETCH_DATA_READY : 'c-data-ready'
            }
        }
    };

    return DataBehaviorEvents;
});
