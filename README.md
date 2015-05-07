# LinkedIn-Crawler
Simple profile picture crawler using CasperJS

To run this crawler, login credentials to LinedIn are required. Pass them in as the first two arguments when running the file

`casperjs linkedin.js loginEmailAddress loginPassword`

Also **required**, are the flags  `--ignore-ssl-errors=true`  and  `--web-security=no` which help with "Unsafe JavaScript attempt to access frame with URL" error which can occur in Phantom 1.9.8. and downloading over https connection. [Reference](https://github.com/n1k0/casperjs/issues/1068)
