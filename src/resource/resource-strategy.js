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
            'ju-components/util',
            'ju-components/resource/storage/options-data-storage'
        ],
        function(
            $,
            Class,
            DependencyLoader,
            L10n,
            CssLoader,
            ResourceProxy,
            ComponentUtils,
            OptionsDataStorage
        ) {
    'use strict';

    var MSG_LOADING_L10N = 'ResourceLoader: loading language:',
        MSG_NOT_LOADED_L10N = 'ResourceLoader: L10n key is not loaded yet:',
        MSG_LOADING_OPTIONS_DATA = 'ResourceLoader: loading options data:',
        MSG_NOT_LOADED_OPTIONS_DATA = 'ResourceLoader: Optins data key is not loaded yet:',
        MSG_LOADING_CLIENT_VAR = 'ResourceLoader: loading client var:';

    var ResourceStrategy = Class.extend({
        init : function(config) {
            // Manager map
            this.config = $.extend(true, {
                templates : {
                    templatePath : '/templates/',
                    templateExtension : '.html'
                }
            }, config);

            // Known origin configs (bag)
            this.serverResources = {};
            this.staticResources = {};

            // Initialize
            this.setup();
        },
        setup : function() {
            var origins = ResourceStrategy.KNOWN_RESOURCE_ORIGINS;

            this._iterateKnownTypes(this.config, function(type, resourceConfig) {
                if (resourceConfig) {
                    switch (resourceConfig.origin) {
                        case origins.NONE:
                            // nothing - unsupported resource
                            break;
                        case origins.SERVER:
                            this.serverResources[type] = resourceConfig;
                            break;
                        case origins.STATIC:
                            this.staticResources[type] = resourceConfig;
                            break;
                        default:
                            Logger.error('Resource Strategy : unknown resource origin', type, resourceConfig);
                            break;
                    }
                } else {
                    Logger.error('Resource Strategy : missing resource type manager map', type);
                }
            });
        },
        /**
         * Fetch the resources given the resource map
         *
         *  var resourceMap = {
         *     l10n : resourceCollectorMap.l10n, => [{},...]
         *     cssFile : resourceCollectorMap.cssFile,
         *     templates : resourceCollectorMap.template,
         *     options_data : resourceCollectorMap.optionsData,
         *     context : resourceCollectorMap.context
         * };
         */
        fetchResources : function(resourceMap) {
            var self = this;

            // Make resource map always valid for this strategy
            resourceMap = $.extend(true, {
                context : [],
                cssFile : [],
                l10n : [],
                options_data : [],
                templates : []
            }, resourceMap);

            // Fetching resources
            var childrenReadyPromises = [],
                promise = new Promise(function(resolve, reject) {

                    var staticAssetsPromise = self.fetchStaticAssets(resourceMap),
                        serverDataPromise = self.fetchServerData(resourceMap);

                    childrenReadyPromises.push(staticAssetsPromise);
                    childrenReadyPromises.push(serverDataPromise);

                    // Waits until all the children are ready with their children
                    var childrenReadyPromise = Promise.all(childrenReadyPromises);

                    childrenReadyPromise
                        .then(function(results) {
                            var staticAssets = results[0],
                                serverData = results[1];

                            // Transform loaded resources into resource-manager format
                            var response = {};

                            // Move static loaded resources to response
                            $.each(staticAssets, function(i, r) {
                                $.extend(true, response, r);
                            });

                            // Move server data resources to response
                            $.extend(true, response, serverData);

                            // Returns the array of components in the same order they were defined
                            resolve(response);
                        })
                        ['catch'](reject);

                });

            return promise;
        },
        /**
         * Loads static assets:
         * @param  object resourceMap
         * @return promise
         */
        fetchStaticAssets : function(resourceMap) {
            var types = ResourceStrategy.KNOWN_RESOURCE_TYPES;

            var staticResourcesReadyPromise = this._iterateKnownTypes(this.staticResources, function(type, resourceConfig) {
                var promise = Promise.resolve();
                // Only process resource config from static origin
                if (resourceConfig && this._isValidResourceMap(resourceMap[type])) {
                    // @todo add support for multiple strategies per resource (array)
                    //       if one strategy failed, then maybe the next one will succed
                    switch (type) {
                        case types.CSS:
                            // Request the CSS files using the CSS loader
                            var cssLoader = CssLoader.getInst();
                            cssLoader.getIndividualFiles(resourceMap.cssFile);
                            promise = Promise.resolve({ cssFile : undefined });
                            break;
                        case types.L10N:
                            promise = this._fetchClientVars(resourceMap.l10n,
                                                            L10n,
                                                            MSG_LOADING_L10N,
                                                            MSG_NOT_LOADED_L10N)
                                .then(function(l10nDef) {
                                    return { l10n : l10nDef };
                                });
                            break;
                        case types.OPTION_DATA:
                            promise = this._fetchClientVars(resourceMap.options_data,
                                                            OptionsDataStorage.getInst(),
                                                            MSG_LOADING_OPTIONS_DATA,
                                                            MSG_NOT_LOADED_OPTIONS_DATA)
                                .then(function(optionDataDef) {
                                    return { options_data : optionDataDef };
                                });
                            break;
                        case types.TEMPLATE:
                            promise = this._fetchTemplates(resourceMap.templates)
                                .then(function(templatesDef) {
                                    return { templates : templatesDef };
                                });
                            break;
                        default:
                            Logger.error('Resource Strategy : unknown static resource fetch', type, resourceConfig);
                            break;
                    }
                }
                return promise;
            });

            return Promise.all(staticResourcesReadyPromise);
        },
        /**
         * Loads resources from the server:
         * @param  object resourceMap
         * @return promise
         */
        fetchServerData : function(resourceMap) {
            var types = ResourceStrategy.KNOWN_RESOURCE_TYPES,
                serverResourceMap = {};

            this._iterateKnownTypes(this.serverResources, function(type, resourceConfig) {
                // Only process resource config from server origin
                if (resourceConfig) {
                    // @todo add support for multiple strategies per resource (array)
                    //       if one strategy failed, then maybe the next one will succed
                    if (type === types.CSS && resourceMap[types.CSS]) {
                        // Request the CSS files using the CSS loader
                        var cssLoader = CssLoader.getInst();
                        cssLoader.get(resourceMap[types.CSS]);
                        // makes sure the css files aren't part of the request
                        delete(resourceMap[types.CSS]);
                    } else if (resourceMap[type]) {
                        // If current type was requested, then
                        // include it to be loaded by proxy
                        serverResourceMap[type] = resourceMap[type];
                    }
                }
            });

            // double check to avoid making a pointless request of no resources
            var needNonStaticResources = this._isValidResourceMap(serverResourceMap);

            if (needNonStaticResources) {
                var resourceProxy = ResourceProxy.getInst();
                return resourceProxy.getResources(serverResourceMap)()
                    .then(function(response) {
                        return response.data.response_data;
                    });
            } else {
                // we won't fetch assets from server, resolve right away
                return Promise.resolve({});
            }
        },
        _isValidResourceMap : function(resourceMap) {
            return (resourceMap && !ComponentUtils.isEmptyObject(resourceMap));
        },
        /**
         * Iterate over ResourceStrategy.KNOWN_RESOURCE_TYPES
         * It tries to match known types defined on different config collectors (server, static),
         * so for each iteration, run a callback providing type and retrieved config as arguments
         *
         * @param  {object}   configs  collector of resource manager configurations
         * @param  {Function} callback map function, receives type and resource config
         * @return {array}             set of callbacks returns
         */
        _iterateKnownTypes : function(configs, callback) {
            var types = ResourceStrategy.KNOWN_RESOURCE_TYPES,
                results = [];

            for (var t in types) {
                var type = types[t],
                    resourceConfig = configs[type];
                if (resourceConfig) {
                    results.push(callback.call(this, type, resourceConfig));
                }
            }

            return results;
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

            // Function.prototype.bind IE9+
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
                    promise = this._fetchClientVarByDefinition(clientVar, msgLoading);
                } else {
                    reject(clientVar);
                    // Leave completely, do not run after-for
                    return;
                }
                clientVarsReadyPromise.push(promise);
            }

            Promise.all(clientVarsReadyPromise).then(function(results) {
                var response = {};

                $.each(results, function() {
                    $.extend(response, this);
                });

                resolve(response);
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
        _fetchClientVarByDefinition : function(clientVarDef, msgLoading) {
            return new Promise(function(resolve, reject) {
                if (clientVarDef.path) {
                    clientVarDef.promise = DependencyLoader.getInst().getDependencies({
                        defaultVars : clientVarDef.path
                    })
                    .then(function(dependecies) {
                        log(msgLoading, dependecies);
                        resolve(dependecies.defaultVars.instance, clientVarDef);
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
            var dependencies = {},
                templatesConfig = this.config.templates;

            for (var i = 0; i < templatesFilePath.length; i++) {
                var key = templatesFilePath[i],
                    filePathIncludesExt = (key.lastIndexOf('/') < key.lastIndexOf('.')),
                    fileExt = filePathIncludesExt ? '' : templatesConfig.templateExtension;

                dependencies[key] = 'text!' + templatesConfig.templatePath + key + fileExt;
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

    ResourceStrategy.classMembers({
        KNOWN_RESOURCE_TYPES : {
            CONTEXT : 'context',
            CSS : 'cssFile',
            L10N : 'l10n',
            OPTION_DATA : 'options_data',
            TEMPLATE : 'templates'
        },
        KNOWN_RESOURCE_ORIGINS : {
            NONE : 'none',
            SERVER : 'server',
            STATIC : 'static'
        }
    });

    // Exports
    return ResourceStrategy;

});
