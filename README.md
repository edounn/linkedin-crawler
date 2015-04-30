# LinkedIn-Crawler
Simple profile picture crawler using CasperJS

To run this crawler, login credentials to LinedIn are required. Pass them in as the first two arguments when running the file

`casperjs linkedin.js loginEmailAddress loginPassword`

Optionally, passing the `--ssl-protocol=tslv1`  or `--web-security=no`flag as an arguemnt helps with the "Unsafe JavaScript attempt to access frame with URL" error which can occur in Phantom 1.9.8. [Reference](https://github.com/n1k0/casperjs/issues/1068)
