chemset.js
==========

A javascript library to typeset chemical equations written in a human readable format.

Installation
------------

The simplest way to install is to include a script tag linking to the code
```html
<script src="https://github.com/porglezomp/chemset.js/releases/download/v0.6/chemset.min.js"></script>
```

Usage
-----

Using chemset.js should be very easy. To use it,
simply write a chemical equation in your page.
The format that chemset.js can parse looks like this:
`CO2`, `H2O`, `H2SO4`, etc.

If you want to include states of matter or charges, write them in.
`H+ (aq) + OH- (aq) --> H2O (l)`
Unit charges `+` and `-` should be written attached to the compound,
and higher charges such as `2+` or `3-` written detached.
The "produces" symbol can be written as an arrow, `--->` with as many dashes as you want.

`Ba(NO3)2 (aq) + Na2SO4 (aq) -> 2NaNO3 (aq) + BaSO4 (s)`
States of matter must be written with a space between them and the compound.
