/*!
 * Bar chart
 */
import Enums from './Enums';
import BaseChart from './BaseChart';
import BarAxis from './BarAxis';
import {select as d3_select,
        max as d3_max,
        sum as d3_sum,
        scaleBand,
        scaleLinear,
        scaleOrdinal,
        schemeCategory20} from 'd3';

import {isFunction as _isFunction, isArray as _isArray } from 'lodash';

export default class BarChart extends BaseChart {
  //
  // ENUMISH
  //


  constructor (selection) {
    super();
    //
    // Create initial object
    //
    this.defaultOptions = {
        padding: 0.05,
        anchor: 'bottom',
        chartClass: 'chart-bar',
        labelPosition: 'none',
        labelAlign: 'left',
        labelColor: '#000',
        labelFormat: null,
        valuesPosition: 'fit',
        valuesAlign: 'left',
        valuesColor: '#000',
        // valuesFormat: null,
        idPrefix: 'bar-',
        barLayout: 'grouped',
        color: scaleOrdinal(schemeCategory20),
        axis: {

        }
    }

    this.options = Object.assign({}, this.baseOptions, this.defaultOptions);

    if (selection) {
      this.draw(selection);
    }
  }

  draw (selection) {
    const that = this
        , textColor = this.options.theme.textColor
    ;

    this.selection = selection || this.selection;
    if (!this.selection) {
      console.warn('Could not find a HTML node to write to, please check your code');
      return;
    }
    if (!_isFunction(this.selection.node)) {
      this.selection = d3_select(this.selection);
    }

    // force a value for the dataType if there is a multi dimensional dataset
    this.options.barLayout = (this.options.dataType === Enums.DATATYPE_MULTIDIMENSIONAL) ? this.options.barLayout || Enums.BARLAYOUT_GROUPED : null;

    this.maxValue = this._maxValue;
    this.xScale = this._xScale;
    this.yScale = this._yScale;

    //
    // Create a grouped breadth scale and update the dataset
    //
    if (this.options.dataType === Enums.DATATYPE_MULTIDIMENSIONAL) {
      this.groupedXScale = this._groupedXScale;

      if (this.options.barLayout === Enums.BARLAYOUT_STACKED) {
        var lpos;
        for(let data of this.options.data) {
          lpos = 0;
          data.values = data.values.map(function (d) {
                          lpos +=  d.values;
                          d.lpos = lpos;
                          return d;
                        });
        };
      }
    }

    const mouseEvents = that.getEventsOfType(['mouse', 'click'])

    // remove old
    if (this.svg) {
      this.svg.remove();
    }

    //
    // The main svg element
    //
    this.svg = this.selection.append('svg')
        .attr('class', 'chart barchart')
        .attr('height', this.options.height)
        .attr('width', this.options.width);

    // The actual bars
    var bars = this.svg.selectAll('rect.chart__bar')
                    .data(this.options.data)
                    .enter()
                    .append('g')
                    .attr("id", function(d){return d.id;})
                    .attr('transform', function (d) {
                      let _x = that.options.margin.left + (that.isVertical ? that.xScale(d.label) : 0)
                        , _y = that.isVertical ? that.options.margin.top : that.xScale(d.label)
                      ;
                      return 'translate(' + _x + ',' + _y +')';
                    });
    //
    // Supply additional data if multi dimensional
    //
    if (that.options.dataType === Enums.DATATYPE_MULTIDIMENSIONAL) {
      let baritems = bars.selectAll("rect")
                      .data(function(d) {
                        return d.values;
                      })
                    .enter()
                      .append('g')
                      .attr('class', 'barItem')
                      .append("rect")
                      .attr('width', this.barWidth)
                      .attr('height', this.barHeight)
                      .attr('x', this.barXPos)
                      .attr('y', this.barYPos)
                      .attr("fill", function(d) {
                        return that.options.color(d.label);
                      });

        for(let e of mouseEvents) {
          baritems.on(e.action, e.method);
        };
      }
      //
      // Single dimension just sets the bars
      //
      else {
        bars.append("rect")
            .attr(dimensions)
            .attr(positions)
            .style("fill", function(d) {
              return that.options.color(d.label);
            });

      }

    //   // Draw labels if required
    //   if (that.options.labelPosition !== Enums.LABEL_NONE || that.options.valuesPosition !== 'none') {
    //     // that.drawLabels();
    //   }

      if (that.axis.y && that.axis.y.show()) {
        if (!that.yaxis) {
          that.yaxis = new BarAxis('y');
        }
        that.yaxis.anchor(that.options.anchor)
                  .margin(that.options.margin)
                  .height(that.options.height)
                  .scale(that.yScale)
                  .draw(this.svg);
      }

      if (that.axis.x && that.axis.x.show()) {
        if (!that.xaxis) {
          that.xaxis = new BarAxis('x');
        }
        that.xaxis.anchor(that.options.anchor)
                  .margin(that.options.margin)
                  .height(that.options.height)
                  .scale(that.xScale)
                  .draw(this.svg);
      }
    //   // //
    //   // Add the draw event to bar charts
    //   //
      if (_isArray(that.options.on) && that.options.on.length) {
        drawEvent = that.options.on.find(function (o) {
          return o.action === 'draw';
        });

        if (drawEvent && _isFunction (drawEvent.method)) {
          drawEvent.method.call(that);
        }
      }


    this.svg.selectAll(".axis text")
          .attr('fill', textColor)
          .style('font-size', '0.875rem');

    this.svg.selectAll('.axis line, .axis path')
          .attr('fill', 'none')
          .attr('stroke', textColor)
          .attr('stroke-width', '1');
    }




    /**
     * Sets the layout of the chart
     * @param  {String} value - the type of layout to use allowed values = BARLAYOUT_GROUPED | BARLAYOUT_STACKED
     * @return {Mixed}        - the value or chart
     */
    barLayout(value) {
      if (!arguments.length) return this.options.barLayout;
      value = String(value).toLowerCase();
      // wrong value supplied
      if (value !== Enums.BARLAYOUT_GROUPED &&
          value !== Enums.BARLAYOUT_STACKED) {
        console.error(value, 'is invalid. Only ', Enums.BARLAYOUT_STACKED, ' OR ', Enums.BARLAYOUT_GROUPED, ' allowed');

        return this;
      }
      this.options.barLayout = value;

      return this;
    }

    /**
     * Sets the direction of the graph
     * @param  {String} value - the direction used, allowed values = ANCHOR_LEFT | ANCHOR_RIGHT | ANCHOR_BOTTOM | ANCHOR_TOP
     * @return {Mixed}        - the value or chart
     */
    anchor (value) {
      if (!arguments.length) return this.options.anchor;
      value = String(value).toLowerCase();
      // wrong value supplied
      if (value !== Enums.ANCHOR_LEFT &&
          value !== Enums.ANCHOR_RIGHT &&
          value !== Enums.ANCHOR_TOP &&
          value !== Enums.ANCHOR_BOTTOM) {
        console.error(value, 'is invalid. Only ', Enums.ANCHOR_LEFT, ', ', Enums.ANCHOR_RIGHT, ', ', Enums.ANCHOR_TOP, ' or ', Enums.ANCHOR_BOTTOM, 'allowed');
        return this;
      }
      this.options.anchor = value;

      return this;
    }

    /**
     * Accessor for the axis
     * @return {Object} - returns an object with x and y, each an instance of the BarAxis class
     */
    get axis() {
      let ax = {};
      this.xaxis = this.xaxis || new BarAxis('x', this);
      this.yaxis = this.yaxis || new BarAxis('y', this);
      ax.x = this.xaxis;
      ax.y = this.yaxis;

      return ax;
    }

    //
    //
    // Getters, should have been subclassed maybe?
    //
    //
      /**
   * creates and returns a breadth scale, this is the scale that handles the wideness of a bar, irrespective of dimension
   *
   * @return {scaleBand} - an ordinal scale to calculate the wideness of a bar
   */
  get _xScale () {
    let bRange;

    //
    // Range
    //
    if (this.isVertical) {
      bRange = [0 , this.calculatedWidth];
    } else {
      bRange = [this.options.margin.top, this.options.height - this.options.margin.bottom]; // if horisontal the "breadth" equals the height and must be caluculad from vertical dimensions
    }

    //
    // Domain
    //
    const bDomain = this.options.data.map(d => {
                return d.label;
              });

    //
    // Scale
    //
    return scaleBand()
                    .domain(bDomain)
                    .paddingInner(this.options.padding)
                    .range(bRange, 0.1);
  }


  /**
   * creates and returns a length scale, this is the scale that handles the length of a bar, irrespective of dimension
   *
   * @return {scaleLinear} - a linear scale to calculate the length of a bar
   */
  get _yScale () {
    let lRange;

    //
    // Range
    //
    if (this.isVertical) {
      lRange = [0, this.calculatedHeight];
    } else {
      lRange = [0, this.calculatedWidth];
    }

    //
    // Scale
    //
    return scaleLinear()
                    .domain([0, this._maxValue])
                    .range(lRange);
  }

  /**
   * creates and returns a breadth scale for grouped data, this is the scale that handles the wideness of a bar within a group, irrespective of dimension
   *
   * @return {scaleBand} - an ordinal scale to calculate the wideness of grouped bar
   */
  get _groupedXScale() {
    let bDomain;
    const data = this.options.data[0];

    //
    // Domain
    //
    bDomain = data.values.map(d => {
                return d.label;
              });

    //
    // Scale
    //
    return scaleBand()
                    .domain(bDomain)
                    .range([this.xScale.bandwidth(), 0]);
  }

  /**
   * Returns the max value for a dataset
   * if the dataset is a stacked dataset, the max will then be the max of the sum of all values for a node
   *
   * @return {Number} - The highest value or sum found in the dataset
   */
  get _maxValue () {
    const that = this;
    return d3_max(this.options.data, function (d) {
            // multi dimensional data
            if (that.options.dataType === Enums.DATATYPE_MULTIDIMENSIONAL) {
              // grouped data
              if (that.options.barLayout === Enums.BARLAYOUT_GROUPED) {
                return d3_max(d.values, function (d2) {
                  return d2.values;
                });
              }
              // stacked data
              else {
                return d3_sum(d.values, function (d2) {
                  return d2.values;
                });
              }
            }
            // uni dimensional data
            return d.values;
        });
  }

  //
  // MOve to base
  //


    /**
     * returns the width of the bar (could be breadth or length depending on dimension)
     * @return {function} - a function to get the width of a bar
     */
    get barWidth() {
      if (this.isVertical) {
        return this.barBreadth;
      }
      return this.barLength;
    }

    /**
     * returns the height of the bar (could be breadth or length depending on dimension)
     * @return {function} - a function to get the height of a bar
     */
    get barHeight() {
      if (this.isVertical) {
        return this.barLength;
      }
      return this.barBreadth;
    }

    /**
     * Returns a function to get the wideness of a bar
     * @return {function} - function to calculate the wideness of a bar
     */
    get barBreadth() {
      const that = this
          , useGroupedData = (this.options.barLayout === Enums.BARLAYOUT_GROUPED);

      return function (d) {
        let value = useGroupedData ? that.groupedXScale.bandwidth() : that.xScale.bandwidth();
        return Math.max(value, 1);
      };
    }

    /**
     * Returns a function to get the length of a bar
     * @return {function} - function to calculate the length of a bar
     */
    get barLength() {
      const that = this;

      return function(d) {
        return that.yScale(d.values);
      };
    }

    /**
     * [barXPos description]
     * @return {[type]} [description]
     */
    get barXPos() {
      if (this.isVertical) {
        return this.getBreadthPos();
      }
      return this.getLengthPos();
    }


    /**
     * [barYPos description]
     * @return {[type]} [description]
     */
    get barYPos() {
      if (this.isVertical) {
        return  this.getLengthPos();
      }
      return this.getBreadthPos();
    }


    /**
     * Returns a function used to calculate the length of a bar
     * @return {function} - the length pos function
     */
    getBreadthPos() {
      const that = this
          , useGroupedData = (this.options.barLayout === Enums.BARLAYOUT_GROUPED);

      return function(d) {
        return useGroupedData ? that.groupedXScale(d.label) : 0 ;
      };
    }


    /**
     * Returns a function used to calculate the length of a bar
     * @return {function} - the length pos function
     */
    getLengthPos() {
      const that = this
          , useStackedData = (this.options.barLayout === Enums.BARLAYOUT_STACKED);

      return function(d) {
        // stacked data needs to use cummulative sizes
        if (useStackedData) {
          if (that.options.anchor === Enums.ANCHOR_LEFT || that.options.anchor === Enums.ANCHOR_TOP ) {
            return that.yScale(d.lpos) - that.yScale(d.values);
          }
          return that.calculatedHeight - that.yScale(d.lpos);
        }

        if (that.options.anchor === Enums.ANCHOR_TOP || that.options.anchor === Enums.ANCHOR_LEFT ) {
          return 0;
        }

        if (that.options.anchor === Enums.ANCHOR_RIGHT ) {
          return that.calculatedWidth - that.yScale(d.values);
        }

        return that.calculatedHeight - that.yScale(d.values);
      };
    }



}