/*global define:true requirejs:true*/
/* jshint strict: false */
requirejs.config({
    paths: {
        'jquery': 'jquery/jquery',
        'extend': 'gextend/extend',
        'gtask': 'gtask'
    }
});

define(function (require) {
    console.log('Loading');
    var Gtask = require('gtask'),
        $ = require('jquery');

    Gtask.prototype.emit = function(type){
        console.debug(type)
    };


    Queue().enqueue(Gtask({
        id:'get-user:',
        label: 'Getting user data...',
        task: function (done) {
            console.log(this.id, this.label);
            setTimeout(function(){
                console.log(this.id, ' data got')
                done();
            }.bind(this), 2000);
        }
    }))
    .enqueue(Gtask({
        id:'get-device:',
        label:'Getting device ID',
        task: function () {
            console.log(this.label);
        }
    }))
    .enqueue(Gtask({
        id:'connect-server:',
        label:'Getting connect to server...',
        when:function(){
            var doIt = Math.random() > .6;
            console.log('DO IT', doIt)
            return doIt;
        },
        task: function () {
            console.log(this.label);
        }
    }))
    .enqueue(Queue().enqueue(Gtask({
        id:'get-config',
        label:'Subtask: Retrieve config from server...',
        task: function (done) {
            console.log('\t execute', this.id)
            setTimeout(function(){
                console.log('\t',this.label);
                done();
            }.bind(this), 1000);
        }
    })))
    .execute()
    .onSuccess = function(){
        console.log('DONE')
        return this
    };
});


function Queue(){
    if(this.constructor !== Queue) return new Queue();
    this.items = {};
    this.tasks = [];
    this.autoexecute = false;
}



Queue.prototype.enqueue = function(task) {
    this.items[task.id] = task;
    task.owner = this;
    var index = this.tasks.push(task);
    this.autoexecute && this.start(index);

    return this;
};

Queue.prototype.execute = function(index){
    index || (index = 0);
    setTimeout(this.process.bind(this, index), 0);
    return this;
};

Queue.prototype.process = function process(index) {
    if (this.tasks.length < 1 || this.index) return

    var task = this.tasks.shift();

    if (!task) return console.log('process no process');

    this.index = index;

    task.onAbort = function(){
        task.onAbort = null;
        this.index = 'aborted';
        this.emit('abort');
    };

    task.onSuccess = function() {
        task.onSuccess =
        this.index = null;
        if(this.tasks.length) this.process();
        else this.emit('success');
    }.bind(this);

    task.execute();
};

Queue.prototype.emit = function(e){
    var handler = 'on' + e.charAt(0).toUpperCase() + e.slice(1);
    if(typeof this[handler] !== 'function') return;
    var args = Array.prototype.slice(arguments, 1);
    setTimeout(function(){
        this[handler].apply(this, args);
    }.bind(this), 0);
};