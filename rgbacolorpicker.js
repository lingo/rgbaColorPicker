/**
 * rgbaColorPicker
 *
 * @author Phillip Gooch <phillip.gooch@gmail.com>
 *
 * Refactored and converted to RequireJS format by
 * @author Luke Hudson <lucas@speak.geek.nz>
 *
 */
define(['jquery', 'tinycolor', 'text!../lib/rgbaColorPicker/default.css'], function($, tinycolor, defaultCSS) {

    var extend = $.extend; // override these to remove dependencies.

    var pickerTemplate = '<div class="rgbapicker_container" style="display: none;">'
            + '<div class="rgbapicker">'
                + '<div class="selectedcolorconainer" ><div class="selectedcolor" ></div></div>'
                + '<input type="text" name="" class="actualcolor" value="">'
                + '<input type="hidden" class="color r" value="" />'
                + '<input type="hidden" class="color g" value="" />'
                + '<input type="hidden" class="color b" value="" />'
                + '<input type="hidden" class="color a" value="" />'
                + '<div class="colorselect"><div class="colorhighlight"></div></div>'
                + '<div class="grayselect"><div class="grayhighlight"></div></div>'
                + '<div class="alphaselect"><div class="alphahighlight"></div></div>'
                + '<div class="shrink"></div>'
                + '<div class="backdrop"></div>'
            + '</div>'
        + '</div> ';

    function get_xy(target, e) {
        target = $(target);
        var xy = {};
        xy.absolute    = {};
        xy.element     = {};
        xy.relative    = {};
        xy.container   = {};
        xy.absolute.x  = e.pageX;
        xy.absolute.y  = e.pageY;
        xy.element.x   = target.position().left;
        xy.element.y   = target.position().top;
        xy.container.x = target.parent().parent().position().left;
        xy.container.y = target.parent().parent().position().top;
        xy.relative.x  = (xy.absolute.x - xy.element.x) - xy.container.x;
        xy.relative.y  = (xy.absolute.y - xy.element.y) - xy.container.y;
        return xy;
    }

    function get_color(xy) {
        var h = Math.round((xy.relative.x / 359) * 360);
        var s = 100; // always 100 unless selecting a gray
        var l = Math.round(((xy.relative.y / 179) - 1) * -100)
        return tinycolor('hsl(' + h + ',' + s + ',' + l + ')').toRgb()
    }

    function get_gray(xy) {
        var h = 0; // always 0 unless selecting a color
        var s = Math.round((xy.relative.x / 359) * 255);
        var l = Math.round(((xy.relative.y / 179) - 1) * -100);
        return s;
    }

    function get_alpha(xy) {
        var a = Math.round(((xy.relative.y / 179) * -100) + 100) / 100;
        return a;
    }

    /**
     * Detect a color value on the element,
     * searching various data until found.
     *
     * @param  {jQuery|string|HTMLElement} elt Target element
     * @return {string}     Returns false if nothing can be found
     */

    function getColorFromElement(elt) {
        elt = $(elt);
        if (elt.val()) { //INPUT
            return elt.val();
        }
        if (elt.data('color') !== undefined) {
            return elt.data().color;
        }
        if (elt.text() !== '') {
            return elt.text();
        }
        return false;
    }

    function RGBA(elt, opt) {
        this.opt = {
            stylesheet: false,
            callback:   false,
            alpha:      true,
            force_rgba: false
        };
        this.color = {
            r: 0,
            g: 0,
            b: 0,
            a: 0
        };
        this.picker  = null;
        this.element = null;
        this.init(elt, opt);
    }

    RGBA.prototype.show = function() {
        var element = this.picker.find('.rgbapicker');

        // if ($(window).width() < (xy.relative.x + 380)) {
        //     element.addClass('left');
        // } else {
        //     element.addClass('right');
        // }
        this.picker.find('.backdrop').show();
        this.picker.show();
    };

    RGBA.prototype.hide = function() {
        this.picker.find('.backdrop').hide();
        this.picker.hide();
    };

    RGBA.prototype.getColor = function() {
        this.update_color();
        return this.picker.find('.actualcolor').val(f);
    };

    RGBA.prototype.setColor = function(clr) {
        clr = tinycolor(clr).toRgb();
        this.update_color(clr.r, clr.g, clr.b, clr.a);
    };

    RGBA.prototype.bindEvents = function() {
        var T = this;

        var selectedClr = this.picker.find('.selectedcolor');
        selectedClr.on('click', function(e) {
            T.update_color();
            T.hide();
        });

        var colorSelect = this.picker.find('.colorselect');
        var colorSelectMouseMove = function(e) {
            if (!T._dragging) {
                return;
            }            
            var $this = $(this);
            var xy    = get_xy($this, e);
            if ((xy.relative.x >= 0) && (xy.relative.x < 360) && (xy.relative.y >= 0) && (xy.relative.y < 180)) {
                $this.find('.colorhighlight').css({
                    left: xy.relative.x,
                    top:  xy.relative.y
                });
                var c = get_color(xy)
                T.update_color(c.r, c.g, c.b)
                T.update_alpha_overlay(c.r, c.g, c.b);
            }
        };
        colorSelect.on('mousedown', function(e) {
            var $this = $(this);
            var xy    = get_xy($this, e);
            var c     = get_color(xy);
            T.update_color(c.r, c.g, c.b)
            T.update_alpha_overlay(c.r, c.g, c.b);
            $this.find('.colorhighlight').show().css({
                left: xy.relative.x,
                top:  xy.relative.y
            });
            $this.parent().find('.grayhighlight').hide();
            T._dragging = true;
        });
        colorSelect.on('mousemove', colorSelectMouseMove);

        var unbindMM = function(e) {
            T._dragging = false;
        };
        colorSelect.on('mouseup', unbindMM);

        this.picker.find('input.actualcolor').on('keydown', function(e) {
            if (e.keyCode == 13) {
                var $this = $(this);
                var dc = tinycolor($this.val()).toRgb();
                T.update_color(dc.r, dc.g, dc.b, dc.a);
            }
        });
        var graySelectMouseMove = function(e) {
            if (!T._dragging) {
                return;
            }
            var $this = $(this);
            var xy = get_xy($this, e);
            if ((xy.relative.x >= 0) && (xy.relative.x < 360) && (xy.relative.y >= 0) && (xy.relative.y < 18)) {
                $this.find('.grayhighlight').css('left', xy.relative.x).css('top', 0)
                var g = get_gray(xy)
                T.update_color(g, g, g)
                T.update_alpha_overlay(g,g,g);
            }
        };
        var graySelect = this.picker.find('.grayselect');
        graySelect.on('mousedown', function(e) {
            var $this = $(this);
            var xy = get_xy($this, e);
            var g = get_gray(xy)
            T.update_color(g, g, g)
            T.update_alpha_overlay(g,g,g);
            $this.find('.grayhighlight').show().css({
                'left': xy.relative.x,
                'top': 0
            });
            $this.parent().find('.colorhighlight').hide();
            T._dragging = true;            
        });
        graySelect.on('mousemove', graySelectMouseMove);
        graySelect.on('mouseup', unbindMM);

        var alphaSelect = this.picker.find('.alphaselect');
        var alphaSelectMouseMove = function(e) {
            if (!T._dragging) {
                return;
            }
            var $this = $(this);
            var xy = get_xy($this, e);
            if ((xy.relative.x >= 0) && (xy.relative.x < 18) && (xy.relative.y >= 0) && (xy.relative.y < 180)) {
                $this.find('.alphahighlight').css({
                    left: 0,
                    top: xy.relative.y
                });
                var a = get_alpha(xy)
                T.update_color(undefined, undefined, undefined, a)
            }
        };
        alphaSelect.on('mousedown', function(e) {
            var $this = $(this);
            var xy = get_xy($this, e, '.alphaselect');
            var a = get_alpha(xy)
            T.update_color(undefined, undefined, undefined, a)
            $this.find('.alphahighlight').show().css('left', 0).css('top', xy.relative.y)
            T._dragging = true;            
        });
        alphaSelect.on('mousemove', alphaSelectMouseMove);
        alphaSelect.on('mouseup', unbindMM);

        this.picker.find('.shrink,.backdrop').on('click', function(e) {
            T.hide();
        });
    };

    RGBA.prototype.unbindEvents = function() {
        alert("NOT IMPLEMENTED");
    };

    RGBA.prototype.findPicker = function() {
        var picker = null;
        var existingPicker = $('.rgbapicker_container');
        if (existingPicker.length) {
            picker = existingPicker;
            picker.hide();
        } else {
            picker = $(pickerTemplate);
            $(document.body).append(picker);
            $(document).find('head').append('<style type="text/css">' + defaultCSS + '</style>');
            this.picker = $('.rgbapicker_container');
            this.bindEvents(this.picker);
        }
        return picker;
    }

    RGBA.prototype.init = function(elt, opt) {
        this.opt     = extend(this.opt, opt);
        this.element = $(elt);
        this.picker  = this.findPicker();
        this.color   = tinycolor(getColorFromElement(elt)).toRgb();
        if (!this.opt.alpha) {
            this.color.a = 1;
        }
        this.update_color();
        
        var T = this;
        this.element.on('click', function(e) {
            var $this = $(this);
            var off   = $this.offset();
            T.picker.data('ColorPickerInstance', T);
            T.picker.css({
                position: 'absolute',
                left:     off.left - T.picker.width(),
                top:      off.top
            });
            T.show();
            e.preventDefault();
            return false;
        });
    };

    RGBA.prototype.update_alpha_overlay = function(r,g,b) {
        var alphaSelect = this.picker.find('.alphaselect');
        var rgba_o = 'rgba(' + r + ',' + g + ',' + b + ',1)';
        var rgba_t = 'rgba(' + r + ',' + g + ',' + b + ',0)';
        alphaSelect.css('background', '-moz-linear-gradient(top, ' + rgba_o + ' 0%, ' + rgba_t + ' 100%)');
        alphaSelect.css('background', '-webkit-gradient(linear, left top, left bottom, color-stop(0%,' + rgba_o + '), color-stop(100%,' + rgba_t + '))');
        alphaSelect.css('background', '-webkit-linear-gradient(top, ' + rgba_o + ' 0%,' + rgba_t + ' 100%)');
        alphaSelect.css('background', '-o-linear-gradient(top, ' + rgba_o + ' 0%,' + rgba_t + ' 100%)');
        alphaSelect.css('background', '-ms-linear-gradient(top, ' + rgba_o + ' 0%,' + rgba_t + ' 100%)');
        alphaSelect.css('background', '-linear-gradient(top, ' + rgba_o + ' 0%,' + rgba_t + ' 100%)');
        alphaSelect.css('filter', "progid:DXImageTransform.Microsoft.gradient( startColorstr='" + rgba_o + "', endColorstr='" + rgba_t + "',GradientType=0 )");
    }



    RGBA.prototype.update_color = function(r, g, b, a) {
        var colors = this.picker.find('.color');
        r = r || colors.siblings('.r').val();
        g = g || colors.siblings('.g').val();
        b = b || colors.siblings('.b').val();
        a = a || colors.siblings('.a').val();
        colors.siblings('.r').val(r);
        colors.siblings('.g').val(g);
        colors.siblings('.b').val(b);
        colors.siblings('.a').val(a);
        var c = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
        var f;
        var pickerInstance = this.picker.data('ColorPickerInstance');
        if (!pickerInstance) {
            console.warn("update_color: Failed to find instance bound to picker");
            pickerInstance = this;
        }
        if (pickerInstance.opt.force_rgba) {
            f = c;
        } else {
            var hsl = tinycolor(c).toHsl();
            console.log(hsl);
            if (hsl.s != 0) {
                this.picker.find('.colorhighlight').css({
                    left:    hsl.h,// * 360,
                    top:     Math.abs((hsl.l * 180) - 180),
                }).show();
                this.picker.find('.grayhighlight').css('display', 'none');
            } else if(hsl.s==0) {
                this.picker.find('.grayhighlight').css({
                    left:    hsl.l * 360,
                    top:     0,
                    display: 'block'
                });
                this.picker.find('.colorhighlight').hide();
                console.log('hid colorhighlight', hsl);
            }
            this.picker.find('.alphahighlight').css({
                left:    0,
                top:     Math.abs((hsl.a * 180) - 180),
                display: 'block'
            });
            f = 'transparent';
            if (a == 1) {
                if (tinycolor(c).toName()) {
                    f = tinycolor(c).toName();
                } else {
                    f = tinycolor(c).toHexString();
                }
            } else if (a == 0) {
                f = 'transparent'
            } else {
                f = tinycolor(c).toRgbString();
            }
            this.picker.find('.actualcolor').val(f);
            this.picker.find('.selectedcolor').css('background-color', f);
        }
        if (typeof pickerInstance.opt.callback === 'function') {
            pickerInstance.opt.callback.call(pickerInstance, pickerInstance.element, f);
        }
    }

    return RGBA;
});