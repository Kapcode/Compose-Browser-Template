function myMinimalTestFunction() {
        console.log("myMinimalTestFunction executed ONCE");
    }
    myMinimalTestFunction();

    // If you want to be 100% sure module aspects are working, you can add this:
    // import { minimalConstant } from './minimal_constants.js';
    // console.log(minimalConstant);

    console.log("minimal.js loaded and executed");