[![Build Status](https://travis-ci.org/hulilabs/ju-components.svg?branch=master)](https://travis-ci.org/hulilabs/ju-components)

# Ju-Components
This library can be used as a standalone library or as a separate dependencies library, in which case we will need to add the following entry to the require config file:

    require.config({
        paths: {
            'ju-components' : 'lib/vendor/ju-components'
        }
    });

# about ju-components
Components are self contained blocks whose intention is to be easily reusable, modular and provide a common interface to interact with other components.

They're defined as a hierarchical set of objects, that handle resources (stylesheets, markup, translations, and options, contextual and configuration data), data and visual elements.

Here we provide some details about their life cycle, definition and a subset of the API.

## component's definition
The most important elements are the `resources`, the `children definition` and the component's class definition itself.

### resource map

    {
        cssFile : [ list of css file paths ],
        l10n : [ list of l10n keys ],
        template : [ list of template paths ],
        optionsData : [ list of options data keys ],
        appConfig : [ list of app config keys ],
        context : { dictionary of handler_name => { handler options } }
    }

### children definition

    {
        component : {
            component : 'path/to/a/component',
            insertionPoint : '.imASelector',
            opts : { component-dependent options }
        }
    }

### class definition

An implementation that inherits from BaseComponent class.


## component's life cycle

### init

Here you can set options and resource map.

### load (insertionPoint, ...)

Should be called only in a root component (i.e. a component with no parent, automatically called on children components).  It's the entry point to build a component.
insertionPoint: an element where we'll insert the component. Anything jQuery can handle.

### fetchChildrenComponents

Using the children definition, creates instances of all of them.

### fetchResources

Performs a single request to retrieve the resources required by the whole component tree.

### setup

After the resources are loaded, stores a `$view` reference, sets up some resources, caches the tags defined in `this.S`, automatically calls `bindEvents` and performs children set up.

### setData

If the component includes capabilities to communicate with the server using a proxy (i.e. by composition of FetchHandler) they can retrieve data and load it into the components tree.

## component's api I (data flow)

The most important methods are `getData` and `setData`.  Both of them produce/consume an object that's mapped to the component hierarchy.  In other words, for the following object:

    { name : { first_name : 'Satanás', last_name : 'Ramírez' }, identification : '333' }

And the following component definition in any root component:

    {
        name : { component : 'somepath', insertionPoint : 'someInsertionPoint},
        identification : { component : 'somepath', insertionPoint : 'someInsertionPoint}
    }

And the following children definition for `name` component:

    {
        first_name : { component : 'somepath', insertionPoint : 'someInsertionPoint},
        last_name : { component : 'somepath', insertionPoint : 'someInsertionPoint}
    }

We can rely in an implicit flow that will take advantage of the mapping to pass the data to the component whose key matches the data key.  In other words, if we `setData` in the parent component of `name` and `identification`, the `first_name` and `last_name` data will be set into the components with the same name without any additional code.

The same happens for `getData`.  The produced object will have the same structure as the one of the component tree, so we can have a payload ready to be passed to anybody expecting the same JSON data defined above.

## Some important notes

* You can define a `this.S` object with selectors.  The keys will be mapped to a `this.t` object with the same keys defined in `this.S` but with a dollar sign at the beginning. (e.g. S = { view : '.view'} => t = {$view : jQuery object } )
* Always prefer composition over inheritance when creating new components.
* Always use templates when dynamic markup generation is required.
* There are methods to manipulate the get/setData flow.  Always try to keep the implicit flow unmodified unless you have to make data-specific operations (like in the case you have a component whose data shouldn't be get, so you override getData to prevent that to happen)
