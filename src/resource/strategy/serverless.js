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
            'ju-components/resource/storage/options-data-storage'
        ],
        function(
            $,
            Class,
            DependencyLoader,
            L10n,
            CssLoader,
            ResourceProxy,
            OptionsDataStorage
        ) {
    'use strict';

    // Constants
    var MSG_LOADING_L10N = 'ResourceLoader: loading language:',
        MSG_NOT_LOADED_L10N = 'ResourceLoader: L10n key is not loaded yet:',
        MSG_LOADING_OPTIONS_DATA = 'ResourceLoader: loading options data:',
        MSG_NOT_LOADED_OPTIONS_DATA = 'ResourceLoader: Optins data key is not loaded yet:',
        MSG_LOADING_CLIENT_VAR = 'ResourceLoader: loading client var:';

    /**
     * This strategy loads the static resources from public accesible
     * folders from the client side in the local application
     * i.e. without a server.
     * This is intended to be the default loader
     * if no server side resource provider is available.
     *
     * Server data such as app_config and context is not be supported
     */
    var ServerLessLoaderStrategy = Class.extend({
        init : function(opts, staticAssetsResourceManagerMap) {

            this.opts = $.extend({
                templatePath : '/templates/',
                templateExtension : '.html'
            }, opts);

            // Preload default static assets
            if (staticAssetsResourceManagerMap) {
                this.defaultResourcePromise = this.fetchResources(staticAssetsResourceManagerMap);
            }
        },
        /**
         * Fetch the resources given the resource map
         *
            var resourceMap = {
                // Static related resources
                l10n : resourceCollectorMap.l10n,
                cssFile : resourceCollectorMap.cssFile,
                templates : resourceCollectorMap.template,
                options_data : resourceCollectorMap.optionsData

                // not supported resources
                app_config : resourceCollectorMap.appConfig,
                context : resourceCollectorMap.context
            };
         */
        fetchResources : function(resourceMap) {
            var self = this;

            // Wait until default resources are loaded
            if (self.defaultResourcePromise) {
                return self.defaultResourcePromise.then(function() {
                    self.defaultResourcePromise = null;
                    return self.fetchResources(resourceMap);
                });
            }

            // Make resource map always valid for this strategy
            resourceMap = $.extend(true, {
                l10n : [],
                cssFile : [],
                templates : [],
                options_data : []
            }, resourceMap);

            // Fetching resources
            var promise = new Promise(function(resolve, reject) {

                    var staticAssetsPromise = self.fetchStaticAssets(resourceMap);

                    // Waits until all the children are ready with their children
                    staticAssetsPromise
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
         * optionsData
         *
         * @param  object resourceMap
         * @return promise
         */
        fetchStaticAssets : function(resourceMap) {
            var resourcesReadyPromises = [];

            // Request the CSS files using the CSS loader
            this._fetchCssFiles(resourceMap.cssFile);

            // Request L10n client vars
            var l10nPromise = this._fetchClientVars(resourceMap.l10n,
                                                    L10n,
                                                    MSG_LOADING_L10N,
                                                    MSG_NOT_LOADED_L10N);
            resourcesReadyPromises.push(l10nPromise);

            // Request options data client vars
            var optionsDataPromise = this._fetchClientVars(resourceMap.options_data,
                                                            OptionsDataStorage.getInst(),
                                                            MSG_LOADING_OPTIONS_DATA,
                                                            MSG_NOT_LOADED_OPTIONS_DATA);
            resourcesReadyPromises.push(optionsDataPromise);

            // Request template file using dependency loader
            var templatesPromise = this._fetchTemplates(resourceMap.templates)
                            .then(function(templatesDef) {
                                return { templates : templatesDef };
                            });
            resourcesReadyPromises.push(templatesPromise);

            return Promise.all(resourcesReadyPromises);
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
         * On client var dependency loaded handler
         * @param  {object}            clientVarDef      loaded client var definition
         * @param  {ClientVarsManager} clientVarsManager
         * @param  {string}            msgLoading        loading message
         * @param  {array}             dependecies       array of loaded client side variables
         */
        _onClientVarDependenciesLoaded : function(clientVarDef, clientVarsManager, msgLoading, dependecies) {
            log(msgLoading, dependecies);
            clientVarsManager.append(dependecies.defaultVars.instance);
        },
        /**
         * Fetch client side vars by keys or accesible client side files
         * @param  {array}             definitions       array of keys (static var key for retrieval)
         *                                               array of objects with paths (files to load)
         * @param  {ClientVarsManager} clientVarsManager
         * @param  {string}            msgLoading        loading message
         * @param  {string}            msgError          error message
         * @return {Promise}                             fetching promise
         */
        _fetchClientVars : function(definitions, clientVarsManager, msgLoading, msgError) {
            // Loading message can't be empty
            msgLoading = msgLoading ? msgLoading : MSG_LOADING_CLIENT_VAR;

            var promise = new Promise(this._fetchClientVarsDefinitions.bind(this, definitions, clientVarsManager, msgLoading));
                promise['catch'](function(clientVar) {
                    Logger.error(msgError, clientVar);
                });

            return promise;
        },
        _fetchClientVarsDefinitions : function(definitions, clientVarsManager, msgLoading, resolve, reject) {
            var clientVarsReadyPromise = [],
                clientVar = null,
                promise = null;

            for (var i in definitions) {
                clientVar = definitions[i];
                if (typeof clientVar === 'string') {
                    promise = this._fetchClientVarByKey(clientVar, clientVarsManager);
                } else if (typeof clientVar === 'object') {
                    promise = this._fetchClientVarByDefinition(clientVar, clientVarsManager, msgLoading);
                } else {
                    reject(clientVar);
                    // Leave completely, do not run after-for
                    return;
                }
                clientVarsReadyPromise.push(promise);
            }

            Promise.all(clientVarsReadyPromise).then(function() {
                resolve();
            })
            ['catch'](function(clientVar) {
                reject(clientVar);
            });
        },
        _fetchClientVarByKey : function(key, clientVarsManager) {
            return new Promise(function(resolve, reject) {
                var keyExists = clientVarsManager.exists(key);
                if (!keyExists) {
                    reject(key);
                } else {
                    resolve(key);
                }
            });
        },
        _fetchClientVarByDefinition : function(clientVarDef, clientVarsManager, msgLoading) {
            var self = this;
            return new Promise(function(resolve, reject) {
                if (clientVarDef.path) {
                    clientVarDef.promise = DependencyLoader.getInst().getDependencies({
                        defaultVars : clientVarDef.path
                    })
                    .then(self._onClientVarDependenciesLoaded.bind(self, clientVarDef, clientVarsManager, msgLoading))
                    .then(function() {
                        resolve(clientVarDef);
                    })
                    ['catch'](function() {
                        reject(clientVarDef);
                    });
                } else {
                    reject(clientVarDef);
                }
            });
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
                templatesFetchInfo = this._transformTemplateFilePathsToDependencies(templatesFilePath),
                dependenciesPromise = DependencyLoader.getInst().getDependencies(templatesFetchInfo);

            return dependenciesPromise.then(function(dependencies) {
                self._transformDependenciesToResourceMap(dependencies);
                return dependencies;
            });
        },
        _transformTemplateFilePathsToDependencies : function(templatesFilePath) {
            var dependencies = {};
            for (var i = 0; i < templatesFilePath.length; i++) {
                var key = templatesFilePath[i],
                    filePathIncludesExt = (key.lastIndexOf('/') < key.lastIndexOf('.')),
                    fileExt = filePathIncludesExt ? '' : this.opts.templateExtension;

                dependencies[key] = 'text!' + this.opts.templatePath + key + fileExt;
            }
            return dependencies;
        },
        _transformDependenciesToResourceMap : function(dependencies) {
            for (var i in dependencies) {
                dependencies[i] = dependencies[i].instance;
            }
            return dependencies;
        }
    });

    // Exports
    return ServerLessLoaderStrategy;

});
