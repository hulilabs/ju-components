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
            'jquery',
            'ju-shared/base-proxy'
        ],
        function(
                    $,
                    BaseProxy
                ) {
    'use strict';

    var ResourceProxy = BaseProxy.extend({
        init : function(opts) {
            this._super(opts);
            /*
                Resources related paths
             */
            this.EP = {};
            this.EP.RESOURCES = BaseProxy.EP.API_PREFIX + 'component/resource';
        },

        setUrl : function(resourcesEndpointUrl) {
            this.EP.RESOURCES = resourcesEndpointUrl;
        },

        getResources : function(resources, successCallback, errorCallback) {

            var self = this,
                promiseFn = function() {
                    return new Promise(function(resolve, reject) {
                        var params = {
                            url : self.EP.RESOURCES,
                            data : resources,
                            type : 'POST',
                            success : function() {
                                var args = arguments;
                                if (successCallback) {
                                    successCallback.apply(this, args);
                                }
                                resolve.apply(self, args);
                            },
                            error : function() {
                                if (errorCallback) {
                                    errorCallback.apply(this, arguments);
                                }
                                reject.apply(this, arguments);
                            }
                        };
                        self.makeAjaxRequest(params, true);
                    });
                };
            return promiseFn;
        }
    });

    // Exports
    return ResourceProxy;

});
