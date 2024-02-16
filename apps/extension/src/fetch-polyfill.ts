// // fetch-polyfill.js
// const fetch = require("node-fetch");
// const {
//   // Blob,
//   // blobFrom,
//   // blobFromSync,
//   // File,
//   // fileFrom,
//   // fileFromSync,
//   // FormData,
//   Headers,
//   Request,
//   Response,
// } = fetch;


// if (!globalThis.fetch) {
//   globalThis.fetch = fetch;
//   globalThis.Headers = Headers;
//   globalThis.Request = Request;
//   globalThis.Response = Response;
// }

// if (!global.fetch) {
//   global.fetch = fetch;
//   global.Headers = Headers;
//   global.Request = Request;
//   global.Response = Response;
// }

require('cross-fetch/polyfill');
