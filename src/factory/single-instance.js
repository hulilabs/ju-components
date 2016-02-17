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
 * Base Component factory
 */
define([
            'require',
            'ju-shared/class'
        ],
        function(
            require,
            Class
        ) {
    'use strict';

    /**
     * Loads and instanciates a single instance of a component
     */
    var SingleInstanceFactory = Class.extend({
            getComponent : function(componentDefObj, defaultCompPath) {

                if (!componentDefObj || typeof componentDefObj === 'string') {
                    componentDefObj = {
                        component : componentDefObj || defaultCompPath
                    };
                }

                var instancePromise = new Promise(function(resolve /* , reject */) {
                    require([componentDefObj.component], function(SpinnerClass) {
                        var compInstance = new SpinnerClass(componentDefObj.opts);
                        compInstance.isRootComponent = true;

                        resolve(compInstance);
                    });
                });

                return instancePromise;
            }
        });

    // Exporting module
    return SingleInstanceFactory;

});
