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
        isAsynTask: function(){
            return this.task.length >= 1;
        },
        incrementInterval: function(){
            return this.interval * 2;
        },

        count: 0,
        autoexecute: false,

        when: _passThrough,
        until: _passThrough,

        task: _noop,
        onFailure: _noop,
        onSuccess: _noop,
        onExecute: _noop,
        onTimeout: _noop,

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
    function Gtask(config){
        if(this.constructor !== Gtask) return new Gtask(config);

        config = _extend({}, this.constructor.DEFAULTS, config);

        if(config.autoinitialize) this.init(config);
    };

    Gtask.className = Gtask.prototype.className = 'Gtask';

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

        _extend(this, config);

        // this.promise = new Promise(this.executor.bind(this));

        if(this.autoexecute) this.execute();

        return this.execute.bind(this);
    };

    Gtask.prototype.execute = function(){
        if(this.isRunning) return //this.promise;

        this.doExecute();
        this._execute();

        return this.promise;
    };

    Gtask.prototype._execute = function(done){
        if(this.isRunning = this.preExecute()) this.executeUntil();
    };

    Gtask.prototype.performTask = function(done) {
        done && (done = done.bind(this));
        //TODO: Make guard, to make sure that done is called!!
        return this.result = this.task.apply(this, done ? this.args.concat(done) : this.args);
    };

    Gtask.prototype.executeUntil = function() {
        if(this.isAsynTask()) return this.performTask(this.postExecute);

        this.performTask();
        this.postExecute();
    };

    Gtask.prototype.preExecute = function(){
        return this.conditionallyExecute('when', this._execute);
    };

    Gtask.prototype.postExecute = function(){
        if(!this.conditionallyExecute('until', this.executeUntil)) return;
        this.setInterval(this.doPass, 0);
    };

    Gtask.prototype.conditionallyExecute = function(action, iterator){
        if( !this.shouldRetryIf(action)) return true;

        this.count += 1;

        if(this.shouldFail()) this.setInterval(this.doFail, 0);
        else this.pid = this.setInterval(iterator, this.postIncrementInterval());

        return false;
    };

    Gtask.prototype.shouldRetryIf = function(action){
        return !this[action].apply(this, this.args);
    };

    Gtask.prototype.shouldFail = function() {
        return this.limit >= 0 && this.count >= this.limit;
    };

    Gtask.prototype.doFail = function() {
        this.endTime = Date.now();
        this.emit('failure');
        // this._reject(this.result);
        this.onFailure.apply(this, this.args);
    };

    Gtask.prototype.doPass = function(){
        this.endTime = Date.now();
        this.emit('success');
        // this._resolve(this.result);
        this.onSuccess.apply(this, this.args);
    };

    Gtask.prototype.doExecute = function(){
        this.startTime = Date.now();
        this.emit('execute');
        this.onExecute.apply(this, this.args);
    };

    Gtask.prototype.postIncrementInterval = function(){
        var currentInterval = this.interval;
        if(this.interval < 0) this.interval = this.incrementInterval();
        return currentInterval;
    };

    Gtask.prototype.setInterval = function(cb, interval) {
        return setTimeout(cb.bind(this), Math.abs(interval));
    };

    // Gtask.prototype.then = function(resolve, reject, unbinded){
    //     return this.promise.then(unbinded ? resolve :resolve.bind(this),
    //                 unbinded ? reject :reject.bind(this)
    //             );
    // };

    // Gtask.prototype.executor = function(resolve, reject){
    //     this._reject = reject;
    //     this._resolve = resolve;
    // };

    Gtask.prototype.executedTime = function(){
        return this.endTime - this.startTime;
    };

    Gtask.prototype.executedCycles = function(){
        return this.count + 1;
    };

    Gtask.prototype.reset = function(){
        this.count =
        this.endTime =
        this.startTime = 0;
        this.result = undefined;
        this.isRunning = false;
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
