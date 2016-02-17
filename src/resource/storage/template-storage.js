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
 * Application config client-side module
 * This layer provides access to server side application settings
 */
define([
            'jquery',
            'ju-shared/client-vars-manager'
        ],
        function(
            $,
            ClientVarsManager
        ) {
    'use strict';

    /**
     * App config manager in the client side
     * Contains application settings coming from the server side
     */
    var TemplateStorage = ClientVarsManager.extend({

    });

    // Keys comming from the server side

    // Exports
    return TemplateStorage;

});
