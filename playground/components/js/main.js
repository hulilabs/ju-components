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
 * Dashboard Main Module
 */

require.config({
    /**
     * This URL will be used temporally
     * @type {String}
     */
    baseUrl: 'js'
});

require([   'require-config'
        ], function () {
    // At this point the baseUrl has already been configured
    require(['app']);
});
