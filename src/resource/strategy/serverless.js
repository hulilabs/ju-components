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
            'ju-components/resource/resource-strategy'
        ],
        function(
            ResourceStrategy
        ) {
    'use strict';

    /**
     * This strategy loads the static resources from public accesible
     * folders from the client side in the local application
     * i.e. without a server.
     * This is intended to be the default loader
     * if no server side resource provider is available.
     *
     * Context data is not supported
     */
    var ServerLessStrategy = ResourceStrategy.extend({
        init : function(opts, preloadResourceMap) {
            // Initialize all resources to
            // be loaded from static context
            opts = $.extend(true, {
                context : {
                    origin : 'none'
                },
                cssFile : {
                    origin : 'static'
                },
                l10n : {
                    origin : 'static'
                },
                options_data : {
                    origin : 'static'
                },
                templates : {
                    origin : 'static'
                }
            }, opts);

            this._super.call(this, opts, preloadResourceMap);
        }
    });

    // Exports
    return ServerLessStrategy;

});
