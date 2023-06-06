let initializing = false, fnTest = /xyz/.test(function () { xyz; }) ? /\b_super\b/ : /.*/;

// The base Class implementation (does nothing)
const Class = function () { };

// Create a new Class that inherits from this class
Class.extend = function (prop) {
  const _super = this.prototype;

  // Instantiate a base class (but only create the instance,
  // don't run the init constructor)
  initializing = true;
  const prototype = new this();
  initializing = false;
  const me = this;

  // Copy the properties over onto the new prototype
  for (const name in prop) {
    // Check if we're overwriting an existing function
    prototype[name] = typeof prop[name] == 'function' &&
      typeof _super[name] == 'function' && fnTest.test(prop[name]) ?
      (function (name, fn) {
        return (function () {
          const tmp = this._super;

          // Add a new ._super() method that is the same method
          // but on the super-class
          this._super = _super[name];

          // The method only need to be bound temporarily, so we
          // remove it when we're done executing
          const ret = fn.apply(this, arguments);
          this._super = tmp;

          return ret;
        });
      })(name, prop[name]) :
      prop[name];

    if (typeof prototype[name] === 'function') {
      prototype[name].bind(this);
    }
  }

  // The dummy class constructor
  function Class2() {
    // All construction is actually done in the init method
    if (!initializing && this.init)
      this.init.apply(this, arguments);
  }

  // Populate our constructed prototype object
  Class2.prototype = prototype;

  // Enforce the constructor to be what we expect
  Class2.prototype.constructor = Class;

  // And make this class extendable
  Class2.extend = Class.extend;

  return Class2;
};

export {
  Class
};