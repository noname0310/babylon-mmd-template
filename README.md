## babylon-mmd-template

Best practice for using babylon-mmd.

Implement and build high-quality mmd in the most optimized way possible with Babylon.js.

**If you want to use babylon-mmd, fork this repository could be a good starting point!**

## Build Settings

- typescript
- webpack (only resolve html template, typescript, and static files)
- Babylon.js (with es6 module tree shaking applied)
- eslint (Babyon.js coding style)

## Details

- Run it with `npm i` & `npm start`

- It will do the eslint fix for you on save

- All code is written in sceneBuilder.ts

- For Add assets put them in the res folder and request them as "res/{assetpath}"

- The sceneBuilder includes mmd sample code using webXR (See the comments in the code for a detailed explanation)
