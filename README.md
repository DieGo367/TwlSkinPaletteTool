# [TwlSkinPaletteTool](https://skinpaltool.dvdo.dev/)

A palette editor for use when making [TWiLightMenu++](https://github.com/DS-Homebrew/TWiLightMenu) skins. Creates the `palette.bin` files that go in the `palettes` folder when using the `UserPalette` options.

## Usage
A `palette.bin` file consists of 16 palettes, corresponding to the DS profile colors. The order is Gray-Blue, Brown, Red, Pink, Orange, Yellow, Lime, Green, Dark Green, Turquoise, Light Blue, Blue, Dark Blue, Violet, Purple, and Magenta. *(This is also visible in the favicon ![favicon.ico](https://skinpaltool.dvdo.dev/favicon.ico), in left-to-right top-to-bottom order).*

The __"Palette Collection"__ section in the middle of the page is your view of all the palettes in your palette file.
The first color in each palette is reserved for transparency, and is marked with the '🚫' emoji.

### Editing colors
Click any color slot to select it, then adjust the color with the color picker to the right. You can alternatively enter color codes in either BGR15 or standard RGB using the text fields. Whatever method you use, the result will be converted to BGR15 for use in the palette file.

### Preview image
To preview your color palettes, import a base image using the __"Set Base Image"__ button. It must be either a `.bmp` or `.grf` image. This will load the image and show you its original palette. ***When you mouse over a palette in your palette set, the preview image will update to use that palette.*** You can also hover over the base palette to see the original image again.

### Auto-filling palettes
With the __"Copy to All"__ button under the base palette, you can copy the palette of your base image to every palette in the collection. This may speed up the process if you have an image where only a few colors will need to be changed in each palette.

You can also generate a palette using a recolored version of your base image. In the __"Set Palette via Recolored Image"__ section, use the selector to choose the target palette (they are listed by color name). Click the button to the right and select your recolored version of the base image (these do not have to be `.bmp`, just any regular image file will do). Preview the palette afterward to ensure it was generated correctly.

### Export and use
When you're finished making changes, click the __"Export palette.bin"__ button to download your palette set. Place this file in the `palettes` folder of your skin and name it after the image it is for, replacing the extension with `.bin`. Be sure to enable the corresponding `UserPalette` option for that image in your `theme.ini`.

### Font mode
Enter font mode by clicking the __"Switch to Font Mode"__ button in the Palette Set Editor. This mode is for creating smaller palette files used with NFTR fonts (currently this is only for `username.bin`). It also has a preview feature! Load in a `.nftr` file to see a text box and preview appear. Type in the text box to update the preview. Like with images, hover over the palettes with your mouse to preview them with your text.

## Building locally
This project is just a static website, albeit using TypeScript. Compile the TypeScript file using `tsc`, then use the http server of your choice.
