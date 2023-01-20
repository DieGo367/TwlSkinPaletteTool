# [TwlSkinPaletteTool](https://skinpaltool.dvdo.dev/)

A palette editor for use when making [TWiLightMenu++](https://github.com/DS-Homebrew/TWiLightMenu) skins. Creates the `palette.bin` files that go in the `palettes` folder when using the `UserPalette` options.

## Usage
A `palette.bin` file consists of 16 palettes, corresponding to the DS profile colors. The order is Gray-Blue, Brown, Red, Pink, Orange, Yellow, Lime, Green, Dark Green, Turquoise, Light Blue, Blue, Dark Blue, Violet, Purple, and Magenta. *(This is also visible in the favicon ![favicon.ico](https://skinpaltool.dvdo.dev/favicon.ico), in left-to-right top-to-bottom order).*

The first color in each palette is reserved for transparency, and is marked with the '🚫' emoji.

### Editing colors
Click any color to select it, then adjust the color with the color picker to the right. You may also enter color codes in either BGR15 or standard RGB using the text fields. Whatever method you use, the result will be converted to BGR15 for use in the palette file.

### Preview image
To preview your color palettes, import a base image using the "Set Base Image" button. It must be either a `.bmp` or `.grf` image. This will load the image and show you its original palette. ***When you mouse over a palette in your palette set, the preview image will update to use that palette.*** You can also hover over the base palette to see the original image again.

### Export and use
When you're finished making changes, click the "Export palette.bin" button to download your palette set. Place this file in the `palettes` folder of your skin and name it after the image it is for, replacing the extension with `.bin`. Be sure to enable the corresponding `UserPalette` option for that image in your `theme.ini`.

### Font mode
Enter font mode by clicking the "Switch to Font Mode" button in the Palette Set Editor. This mode is for creating smaller palette files used with NFTR fonts (currently this is only for `username.bin`).

## Building locally
This project is just a static website, albeit using TypeScript. Compile the TypeScript file using `tsc`, then use the http server of your choice.
