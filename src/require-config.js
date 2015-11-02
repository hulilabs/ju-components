
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
 *  Configure RequireJS baseUrl and paths
 */
require.config({
    baseUrl: '/js',
    paths: {
        'jquery' : 'lib/jquery-exporter',
        'ju-shared' : 'lib/vendor/shared',
        'ju-components' : 'lib/vendor/components'
    }
});
