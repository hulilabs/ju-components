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
            'ju-components/resource/resource-proxy',
            'ju-components/resource/storage/options-data-storage',
            'ju-components/util'
        ],
        function(
            $,
            Class,
            DependencyLoader,
            L10n,
            CssLoader,
            ResourceProxy,
            OptionsDataStorage,
            ComponentUtils
        ) {
    'use strict';

    /**
     * This strategy does a combined approach for loading resources:
     * - static resources (l10n, css, templates, optionsData)
     *      from public accesible folders from
     *      the client side in the local application
     * - server data (optionsData, app_config and context)
     *      hit server endpoint to get the data
     */
    var ServerLessLoaderStrategy = Class.extend({
        init : function(opts) {

            this.opts = $.extend({
                templatePath : '/templates/',
                templateExtension : '.html'
            }, opts);

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

            var self = this,
                childrenReadyPromises = [],
                promise = new Promise(function(resolve, reject) {

                    var staticAssetsPromise = self.fetchStaticAssets(resourceMap),
                        serverDataPromise = self.fetchServerData(resourceMap);

                    childrenReadyPromises.push(staticAssetsPromise);
                    childrenReadyPromises.push(serverDataPromise);

                    // Waits until all the children are ready with their children
                    var childrenReadyPromise = Promise.all(childrenReadyPromises);

                    childrenReadyPromise
                        .then(function(values) {

                            var response = {};
                            $.each(values, function() {
                                $.extend(response, this);
                            });

                            // Returns the array of components in the same order they were defined
                            resolve(response);
                        })
                        ['catch'](reject);

                });
                return promise;
        },
        /**
         * Loads the static assets:
         * l10n
         * cssFiles
         * templates
         *
         * @param  object resourceMap
         * @return promise
         */
        fetchStaticAssets : function(resourceMap) {
            // Request the CSS files using the CSS loader
            this._fetchCssFiles(resourceMap.cssFile);
            // Request L10n client vars
            this._fetchClientVars(resourceMap.l10n, L10n, 'ResourceLoader: L10n key is not loaded yet:');
            // Request options data client vars
            this._fetchClientVars(resourceMap.optionsData, OptionsDataStorage, 'ResourceLoader: Optins data key is not loaded yet:');
            // Request template file using dependency loader
            var promise = this._fetchTemplates(resourceMap.templates)
                            .then(function(templatesDef) {
                                return { templates : templatesDef };
                            });
            return promise;
        },
        /**
         * Loads data from the server:
         * app_config
         * options_data
         * context
         *
         * @param  object resourceMap
         * @return promise
         */
        fetchServerData : function(resourceMap) {
            var nonStaticResources = {
                app_config : resourceMap.appConfig,
                options_data : resourceMap.optionsData,
                context : resourceMap.context
            };

            var needNonStaticResources = !ComponentUtils.isEmptyObject(nonStaticResources);

            if (needNonStaticResources) {
                //
                var resourceProxy = ResourceProxy.getInst(),
                    promise = resourceProxy.getResources(nonStaticResources)()
                                .then(function(response) {
                                    return response.data.response_data;
                                });
                return promise;
            } else {
                // we won't fetch assets from server, resolve right away
                return Promise.resolve(null);
            }
        },
        /**
         * Given an array of css paths to load
         * it will use the CSSLoader to append each file individually in the head
         */
        _fetchCssFiles : function(cssFileArray) {
            var cssLoader = CssLoader.getInst();
            cssLoader.getIndividualFiles(cssFileArray);
        },
        /**
         * For now, we will just validate that the requested client var exists in their manager or storage
         */
        _fetchClientVars : function(keys, clientVarsManager, msg) {
            var allValid = true;
            for (var index = 0; index < keys.length; index++) {
                var key = keys[index];
                allValid = clientVarsManager.exists(key);
                if (!allValid) {
                    Logger.error(msg, key);
                    break;
                }
            }
        },
        /**
         * Use the dependency manager to fetch the templates and transform them
         * back to a resource map
         *
         * @param  Array templatesFilePath
         * @return promise
         */
        _fetchTemplates : function(templatesFilePath) {
            var self = this,
                templatesFetchInfo = this._transformToDependencies(templatesFilePath);
            var dependenciesPromise = DependencyLoader.getInst().getDependencies(templatesFetchInfo);
            return dependenciesPromise.then(function(dependencies) {
                self._transformToResourceMap(dependencies);
                return dependencies;
            });
        },
        _transformToDependencies : function(templatesFilePath) {
            var dependencies = {};
            for (var i = 0; i < templatesFilePath.length; i++) {
                var key = templatesFilePath[i],
                    filePathIncludesExt = (key.lastIndexOf('/') < key.lastIndexOf('.')),
                    fileExt = filePathIncludesExt ? '' : this.opts.templateExtension;

                dependencies[key] = 'text!' + this.opts.templatePath + key + fileExt;
            }
            return dependencies;
        },
        _transformToResourceMap : function(dependencies) {
            for (var i in dependencies) {
                dependencies[i] = dependencies[i].instance;
            }
            return dependencies;
        }
    });

    // Exports
    return ServerLessLoaderStrategy;

});