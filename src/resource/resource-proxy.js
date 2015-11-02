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
                )
{
    'use strict';

    var ResourcesProxy = BaseProxy.extend({
        init : function () {
            /*
                Resources related paths
             */
            this.EP = {};
            this.EP.RESOURCES_API_PREFIX = BaseProxy.EP.API_PREFIX + 'component/resource';
        },
        getResources : function (resources, successCallback, errorCallback) {

            var self = this,
                promiseFn = function () {
                    return new Promise(function (resolve, reject) {
                        var params = {
                            url : self.EP.RESOURCES_API_PREFIX,
                            data: resources,
                            type: 'POST',
                            success : function () {
                                var args = arguments;
                                if (successCallback) {
                                    successCallback.apply(this, args);
                                }
                                resolve.apply(self, args);
                            },
                            error : function () {
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
    return ResourcesProxy;

});