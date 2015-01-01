/*
 * gtask
 * https://github.com/goliatone/gtask
 * Created with gbase.
 * Copyright (c) 2015 goliatone
 * Licensed under the MIT license.
 */
/* jshint strict: false, plusplus: true */
/*global define: false, require: false, module: false, exports: false */
(function (root, name, deps, factory) {
    "use strict";
    // Node
     if(typeof deps === 'function') {
        factory = deps;
        deps = [];
    }

    if (typeof exports === 'object') {
        module.exports = factory.apply(root, deps.map(require));
    } else if (typeof define === 'function' && 'amd' in define) {
        //require js, here we assume the file is named as the lower
        //case module name.
        define(name.toLowerCase(), deps, factory);
    } else {
        // Browser
        var d, i = 0, global = root, old = global[name], mod;
        while((d = deps[i]) !== undefined) deps[i++] = root[d];
        global[name] = mod = factory.apply(global, deps);
        //Export no 'conflict module', aliases the module.
        mod.noConflict = function(){
            global[name] = old;
            return mod;
        };
    }
}(this, 'Gtask', ['extend'], function(extend) {

    /**
     * Extend method.
     * @param  {Object} target Source object
     * @return {Object}        Resulting object from
     *                         meging target to params.
     */
    var _extend= extend;

    /**
     * Shim console, make sure that if no console
     * available calls do not generate errors.
     * @return {Object} Console shim.
     */
    var _shimConsole = function(con) {

        if (con) return con;

        con = {};
        var empty = {},
            noop = function() {},
            properties = 'memory'.split(','),
            methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
                'groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,' +
                'table,time,timeEnd,timeStamp,trace,warn').split(','),
            prop,
            method;

        while (method = methods.pop()) con[method] = noop;
        while (prop = properties.pop()) con[prop] = empty;

        return con;
    };

    var _passThrough = function(){
        return true;
    };

    var _noop = function(){};

///////////////////////////////////////////////////
// CONSTRUCTOR
///////////////////////////////////////////////////

	var OPTIONS = {
        autoinitialize: true,
        isActionSyncronous: function(){
            console.log('IS ASYNCRONOUS', this.action.length)
            return this.action.length === 0;
        },

        count: 0,
        autoexecute: false,

        when: _passThrough,
        until: _passThrough,

        action: _noop,
        fail: _noop,
        pass: _noop,

        interval: -1000,
        limit: -1,

        context: {},
        args:[]
    };

    /**
     * Gtask constructor
     *
     * @param  {object} config Configuration object.
     */
    var Gtask = function(config){
        config = _extend({}, this.constructor.DEFAULTS, config);

        if(config.autoinitialize) this.init(config);
    };

    Gtask.name = Gtask.prototype.name = 'Gtask';

    Gtask.VERSION = '0.0.0';

    /**
     * Make default options available so we
     * can override.
     */
    Gtask.DEFAULTS =  _extend({}, OPTIONS);

///////////////////////////////////////////////////
// PRIVATE METHODS
///////////////////////////////////////////////////

    Gtask.prototype.init = function(config){
        if(this.initialized) return this.logger.warn('Already initialized');
        this.initialized = true;

        console.log('Gtask: Init!');
        _extend(this, config);

        if(this.autoexecute) this.execute();
    };

    Gtask.prototype.execute = function(){
        if(this.preExecute()) this.executeUntil();
    };

    Gtask.prototype.preExecute = function(){
        return this.conditionalExecution('when', this.execute.bind(this));
    };

    Gtask.prototype.conditionalExecution = function(action, iteration){
        if(!this.shouldRetry(action)) return true;

        this.incrementCount();

        if(this.shouldFail()) this.doFail();
        else this.interval(iteration, this.postIncrementInterval());

        return false;
    };

    Gtask.prototype.executeUntil = function() {
        if(this.isActionSyncronous()){
            this.performAction();
            return this.postExecute();
        }
        this.performAction(this.postExecute.bind(this));
    };

    Gtask.prototype.postExecute = function(){
        if(! this.conditionalExecution('until', this.executeUntil)) return
        this.doPass();
    };

    Gtask.prototype.shouldRetry = function(action){
        console.log(action)
        return this[action].apply(this.context, this.args);
    };

    Gtask.prototype.incrementCount = function(action){
        this.count += 1;
    };

    Gtask.prototype.shouldFail = function() {
        return this.limit >= 0 && this.count >= this.limit;
    };

    Gtask.prototype.doFail = function() {
        this.fail.apply(this.context, this.args);
    };

    Gtask.prototype.doPass = function(){
        this.pass.apply(this.context, this.args);
    };

    Gtask.prototype.postIncrementInterval = function(){
        var currentInterval = this.interval;
        if(this.interval < 0) this.interval *= 2;
        return currentInterval;
    };

    Gtask.prototype.interval = function(cb, interval) {
        setTimeout(cb, Math.abs(interval));
    };

    Gtask.prototype.performAction = function(done) {
        this.action.apply(this.context, done ? this.args.concat(done) : this.args);
    };

    /**
     * Logger method, meant to be implemented by
     * mixin. As a placeholder, we use console if available
     * or a shim if not present.
     */
    Gtask.prototype.logger = _shimConsole(console);

    /**
     * PubSub emit method stub.
     */
    Gtask.prototype.emit = function() {
        this.logger.warn(Gtask, 'emit method is not implemented', arguments);
    };

    return Gtask;
}));
