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
            'ju-shared/class',
            'ju-shared/dependency-loader',
            'ju-shared/l10n',
            'ju-components/resource/css-loader',
            'ju-components/resource/resource-proxy'
        ],
        function(
            $,
            Class,
            DependencyLoader,
            L10n,
            CssLoader,
            ResourceProxy
        ) {
    'use strict';

    /**
     * This strategy loads the static resources from public accesible
     * folders from the client side in the local application
     * i.e. without a server.
     * This is intended to be the default loader
     * if no server side resource provider is available.
     *
     * The server data such as options_data, app_config and context
     * will continue to hit an server endpoint to get the data
     *
     */
    var UnifiedProviderStrategy = Class.extend({
        init : function(opts) {

            // Extend the default options
            this.opts = $.extend({}, opts);

            // Request the CSS files using the CSS loader
            this.cssLoader = CssLoader.getInst();

            this.resourceProxy = ResourceProxy.getInst();

        },
        /**
         * Fetch the resources given the resource map
         *
            var resourceMap = {
                // Static related resources
                l10n : resourceCollectorMap.l10n,
                cssFile : resourceCollectorMap.cssFile,
                templates : resourceCollectorMap.template,

                // Data related resources
                app_config : resourceCollectorMap.appConfig,
                options_data : resourceCollectorMap.optionsData,
                context : resourceCollectorMap.context
            };
         */
        fetchResources : function(resourceMap) {

            // Request the CSS files using the CSS loader
            this.cssLoader.get(resourceMap.cssFile);
            // makes sure the css files aren't part of the request
            delete(resourceMap.cssFile);

            // after we remove the cssFile member, the resourceMap might be empty
            // so we double check to don't make a pointless request of no resources
            var isTheResourceMapEmpty = (Object.keys(resourceMap).length === 0);
            if (!isTheResourceMapEmpty) {
                var self = this,
                    promise = new Promise(function(resolve, reject) {
                        var resourcePromise =
                            self.resourceProxy.getResources(resourceMap)();
                        resourcePromise
                            .then(function(response) {
                                // Remove the resources from the loading resources map
                                var data = response.data.response_data;
                                // Returns the array of components in the same order they were defined
                                resolve(data);
                            })
                            ['catch'](reject);
                    });
                    return promise;
            } else {
                return Promise.resolve({});
            }

        }
    });

    // Exports
    return UnifiedProviderStrategy;

});
