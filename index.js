'use strict';

var path = require('path');
var Funnel = require('broccoli-funnel');
var mergeTrees = require('broccoli-merge-trees');
var rename = require('broccoli-stew').rename;

module.exports = {
  name: 'moment',

  included: function(app) {
    this._super.included.apply(this, arguments);

    // see: https://github.com/ember-cli/ember-cli/issues/3718
    if (app.app) {
      app = app.app;
    }

    var options = this.projectConfig();
    var vendor = this.treePaths.vendor;
    app.import(path.join(vendor, 'moment', 'min', 'moment.min.js'));

    if (options.moment && options.moment.includeTimezone) {
      app.import(path.join(vendor, 'moment-timezone', 'tz.js'));
    }
  },

  projectConfig: function() {
    return this.project.config(process.env.EMBER_ENV) || {};
  },

  treeForVendor: function(vendorTree) {
    var trees = [];
    var app = this.app;
    var options = this.projectConfig();
    var momentPath = path.dirname(require.resolve('moment'));

    if (vendorTree) {
      trees.push(vendorTree);
    }

    options = options.moment || {};

    trees.push(new Funnel(momentPath, {
      destDir: 'moment',
      include: [new RegExp(/\.js$/)],
      exclude: ['tests', 'ender', 'package'].map(function(key) {
        return new RegExp(key + '\.js$');
      })
    }));

    if (options.includeTimezone) {
      var timezonePath = [this.project.bowerDirectory, 'moment-timezone', 'builds'];

      switch(options.includeTimezone) {
        case 'all':
          timezonePath.push('moment-timezone-with-data.min.js');
          break;
        case '2010-2020':
          timezonePath.push('moment-timezone-with-data-2010-2020.min.js');
          break;
        case 'none':
          timezonePath.push('moment-timezone.min.js');
          break;
        default:
          throw new Error("Ember Moment: Please specify the moment-timezone dataset to include as either 'all', '2010-2020', or 'none'.");
          break;
      }

      trees.push(rename(new Funnel(path.join(this.project.bowerDirectory, 'moment-timezone', 'builds'), {
        files: [timezonePath[timezonePath.length - 1]]
      }), function(filepath) {
        return path.join('moment-timezone', 'tz.js');
      }));
    }

    return mergeTrees(trees);
  }
};
