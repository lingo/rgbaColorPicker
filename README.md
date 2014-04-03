# rgbaColorPicker #

## Author ##
Phillip Gooch <phillip.gooch@gmail.com>

Refactored and converted to RequireJS format by
@author Luke Hudson <lucas@speak.geek.nz>

## RequireJS ##
This automatically works as a requireJS module.
The current setup declares dependency on jquery and tinycolor.

[TinyColor is available here](https://github.com/bgrins/TinyColor)

jQuery you can *probably* find!

### RequireJS configuration ###

I have the following set up so that rgbaColorPicker can find these dependencies:

```javascript
requirejs.config({
    paths: {
        jquery:             "/path/to/jquery-1.10.2",
        tinycolor:          "/path/to/TinyColor/tinycolor"
    }
});
```
