/**
 * [Description]
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['underscore','d3'] , factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('underscore'),require('d3'));
    } else {
        // Browser globals (root is window)
        root.returnExports = factory(root._, root.d3);
    }
}(this, function (_, d3) {

'use:strict';

function barAxis () {
  return {

    options : {
        axis: {
          linear: {
            show: true,
            rotate: 0,
            label: '',
            ticks: d3.svg.axis().ticks(),
            align: 'left',
            pos: 'bottom',
          },
          ordinal: {
            show: true,
            rotate: 0,
            label: '',
            ticks: d3.svg.axis().ticks(),
            align: 'bottom',
            pos: 'left',
          }
        }
    },

    /**
     * retuns the correct scale to use for the axis
     * @param  {String} scale - What scale to use ( linear | ordinal)
     * @return {d3.scale}     - The correct scale
     */
    axis_getScale: function (scale) {

      // the values, normally y
      if (scale === 'linear') {
        if (this.options.anchor === this.ANCHOR_RIGHT || this.options.anchor === this.ANCHOR_BOTTOM) {
          invertedScale = d3.scale.linear()
                            .domain(this.linearScale.domain().reverse())
                            .range(this.linearScale.range());
          return invertedScale;
        }
        return this.linearScale;
      } else {
        if (this.isVertical()) {
          return this.ordinalScale;
        }
        return this.ordinalScale;
      }
    },

    axis_getTransform: function (dir) {
      if (dir === 'linear') {
        if (this.isVertical()) {
          return 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')';
        }
        return 'translate(' + this.options.margin.left + ',' + (this.options.axis.linear.align === 'top' ? 0 : this.getCalculatedHeight()) + ')';
      }

      if (dir === 'ordinal') {
        if (this.isVertical()) {
          return 'translate(' + this.options.margin.left + ',' + (this.options.axis.linear.align === 'top' ? 0 : this.options.height - this.options.margin.bottom ) + ')';
        }
        return 'translate(' + this.options.margin.left + ',' + this.options.margin.top + ')';
      }
    },

    /**
     * fuzzy replicating nativd d3 ticks count for ordinal scaled axis
     * @param {int} count number of ticks
     */
    _setTickValues: function(count) {

      var total = this.ordinalScale.domain().length
        , step = Math.ceil(total/count) || 0
        , tickValues;

      if(total === 0)
        return [];

      tickValues = this.ordinalScale.domain().filter(function(item, index) {
        return index % step == 1;
      });

      return tickValues.length ? tickValues : [];
    },

    drawAxis: function(selection) {
      var axis = {}
        , that = this
        , axisOpt = this.options.axis
        , transform
        , _linearAxis
        , _ordinalAxis
        , ordinalScale
        , linearRotationAttr
      ;





      if(axisOpt.linear.show) {

        axis.linear = d3.svg.axis()
                    .scale(this.axis_getScale('linear'))
                    .orient(axisOpt.linear.align)
                    .ticks(axisOpt.linear.ticks.count)
                    .tickFormat(axisOpt.linear.ticks.format);

          _linearAxis = this.svg.append('g')
              .attr('class', 'y axis')
              .attr('transform', that.axis_getTransform('linear'))
              .call(axis.linear);

          if (axisOpt.linear.rotate) {
            linearRotationAttr = {};
            //negative rotation needs adjustments
            if(axisOpt.linear.rotate < 0) {
              linearRotationAttr.y = -7;
              linearRotationAttr.x = -7;
            } else {
              linearRotationAttr.y = 0;
              linearRotationAttr.x = 0;
            }
            linearRotationAttr.transform = 'rotate(' + axisOpt.linear.rotate + ')';



            _linearAxis.selectAll('text')
                        .attr(linearRotationAttr)
                        .style('text-anchor', axisOpt.linear.rotate < 0 ? 'end' : 'start');
          }

          _linearAxis
              .append('text')
                .attr('class', 'y-label')
                // .attr('transform', 'rotate(-90)')
                .attr('y', -20)
                .attr('dy', '.71em')
                .attr('fill', '#777')
                .style('font-size', '0.875rem')
                .style('text-anchor', 'start')
                .text(axisOpt.linear.label);
        }

        //yAxis
        if(axisOpt.ordinal.show) {
          ordinalScale = this.axis_getScale('ordinal');
          axis.ordinal = d3.svg.axis()
                    .scale(ordinalScale)
                    .orient(axisOpt.ordinal.align);

          if (axisOpt.ordinal.ticks.count === 0) {
            axis.ordinal.tickValues([]);
          } else if (axisOpt.ordinal.ticks.count > 0) {
            axis.ordinal.tickValues(that._setTickValues(axisOpt.ordinal.ticks.count));
          }

          if (axisOpt.ordinal.ticks.format) {
            axis.ordinal.tickFormat(axisOpt.ordinal.ticks.format);
          }

          _ordinalAxis = this.svg.append('g')
              .attr('class', 'x axis')
              .attr('transform', that.axis_getTransform('ordinal'))
            .call(axis.ordinal);

          if (axisOpt.ordinal.rotate) {
            _ordinalAxis.selectAll('text')
                        .attr('y', axisOpt.ordinal.rotate === 90 ? -6 : 0)
                        .attr('x', 7)
                        // .attr("dy", ".35em")
                        .attr('transform', 'rotate(' + axisOpt.ordinal.rotate + ')')
                        .style('text-anchor', 'start');
          }

          _ordinalAxis
              .append('text')
                .attr('class', 'x-label')
                .attr('transform', 'rotate(-90)')
                .attr('x', 6)
                .attr('y', this.getCalculatedWidth())
                .attr('dy', '.71em')
                .attr('fill', '#777')
                .style('font-size', '0.875rem')
                .style('text-anchor', 'start')
                .text(axisOpt.ordinal.label);



          // axis.y = this.axis()
          //             .show(axisOpt.y.show)
          //             .pos(axisOpt.y.pos)
          //             .align(axisOpt.y.align)
          //             .ticks(axisOpt.y.ticks);


          // _yAxis = this.svg.append('g')
          //     .attr('class', 'y axis')
          //     .attr('transform', 'translate(' + (axis.y.pos() === 'right' ? this.getCalculatedWidth() : this.options.margin.left) + ', 0)')
          //     .call(axis.y());

          // if(y.label) {
          //   _yAxis.append('text')
          //     .attr('transform', 'rotate(-90)')
          //     .attr('y', 6)
          //     .attr('dy', '.71em')
          //     .style('text-anchor', 'end')
          //     .text(y.label);
          // }
        }

    },

    axis: function () {
      var that = this
        , axis = {
          ticks: function (value) {
            if (arguments.length) {
              if(!_.isObject(value)) {
                console.warn('missing value for tick count, allowed is {linear OR ordinal}, values: null ("auto"), 0 ("none") or a number ');
                return that;
              }
              if (_.has(value, 'linear')) {
                that.options.axis.linear.ticks = that.axis_parseTicks(value.linear);
              }
              if (_.has(value, 'ordinal')) {
                that.options.axis.ordinal.ticks = that.axis_parseTicks(value.ordinal);
              }
              return that;
            }
            return {linear: that.options.axis.linear.ticks, ordinal: that.options.axis.ordinal.ticks};
          },
          align: function (value) {
            if (arguments.length) {
              if(!_.isObject(value)) {
                console.warn('missing value for align, allowed is {linear OR ordinal}, values: top | bottom | left | right');
                return that;
              }
              if (value.linear) {
                that.options.axis.linear.align = value.linear;
              }
              if (value.ordinal) {
                that.options.axis.ordinal.align = value.ordinal;
              }
              return that;
            }
            return {linear: that.options.axis.linear.align, ordinal: that.options.axis.linear.align};
          },
          rotate: function (value) {
            if (arguments.length) {
              if(!_.isObject(value)) {
                console.warn('missing value for rotate, allowed is {linear OR ordinal}, values: -180 to 180');
                return that;
              }
              if (_.isNumber(value.linear)) {
                that.options.axis.linear.rotate = value.linear;
              }
              if (_.isNumber(value.ordinal)) {
                that.options.axis.ordinal.rotate = value.ordinal;
              }
              return that;
            }
            return {linear: that.options.axis.linear.rotate, ordinal: that.options.axis.ordinal.rotate};
          },
          label: function (value) {
            if (arguments.length) {
              if(!_.isObject(value)) {
                console.warn('missing value for label, allowed is {linear OR ordinal}, values: any string');
                return that;
              }

              if(_.has(value, 'linear')) {
               that.options.axis.linear.label = value.linear;
              }

              if(_.has(value, 'ordinal')) {
                that.options.axis.ordinal.label = value.ordinal;
              }

              return that;
            }
            return {linear: that.options.axis.linear.label, ordinal: that.options.axis.ordinal.label};
          }
        };
      return axis;
    },

    /**
     * Parse tick options before use
     * @param  {object} ticks {count, format}
     * @return {object}       {count, format}
     */
    axis_parseTicks: function(inData) {

      if (!_.isObject(inData)) {
        console.warn('ticks must be an object with one or both properties "count" (auto | none | [0-n]) "format" (auto | d3,time,format)');
        return {count:null, format:null};
      }

      var count = inData.count
        , format = inData.format
      ;

      switch(count) {
        case 'auto':
        case null:
        case undefined:
          count = null;
          break;
        case 'none':
          count = 0;
          break;
        default:
          count = +count;
          break;
      }

      // TODO: Handfe more formats that just date/time
      switch(format) {
        case undefined:
        case null:
        case 'auto':
          format = null;
          break;
        default:
          format = d3.time.format(format);
          break;
      }

      return {count:count, format:format};
    }
  };
}
return barAxis();
}));